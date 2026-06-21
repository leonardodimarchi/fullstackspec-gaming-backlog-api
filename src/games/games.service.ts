import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameSortField } from '../common/enums/game-sort-field.enum';
import { SortOrder } from '../common/enums/sort-order.enum';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { ListGamesQueryDto } from './dto/list-games-query.dto';
import { mapIgdbTimeToBeatToExpectedTimes } from './igdb/igdb-time.mapper';
import { IgdbExpectedTimes, IgdbGame } from './igdb/igdb.types';
import { IgdbService } from './igdb/igdb.service';
import {
  GameListCache,
  GameListCacheDocument,
} from './schemas/game-list-cache.schema';
import {
  MetadataCache,
  MetadataCacheDocument,
} from './schemas/metadata-cache.schema';
import { Game, GameDocument } from './schemas/game.schema';

const POPULAR_CACHE_KEY = 'popular';
const GENRES_CACHE_KEY = 'metadata:genres';
const PLATFORMS_CACHE_KEY = 'metadata:platforms';

@Injectable()
export class GamesService implements OnModuleInit {
  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    @InjectModel(GameListCache.name)
    private readonly gameListCacheModel: Model<GameListCacheDocument>,
    @InjectModel(MetadataCache.name)
    private readonly metadataCacheModel: Model<MetadataCacheDocument>,
    private readonly igdbService: IgdbService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const gameTtl = this.configService.get<number>(
      'igdb.cacheTtlSeconds',
      604800,
    );
    const popularTtl = this.configService.get<number>(
      'igdb.popularCacheTtlSeconds',
      86400,
    );
    const metadataTtl = this.configService.get<number>(
      'igdb.metadataCacheTtlSeconds',
      604800,
    );

    await this.gameModel.collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: gameTtl },
    );

    await this.gameListCacheModel.collection.createIndex(
      { updatedAt: 1 },
      { expireAfterSeconds: popularTtl },
    );

    await this.metadataCacheModel.collection.createIndex(
      { updatedAt: 1 },
      { expireAfterSeconds: metadataTtl },
    );
  }

  async getPopular(limit = 20): Promise<{ data: GameDocument[] }> {
    const cached = await this.gameListCacheModel
      .findOne({ key: POPULAR_CACHE_KEY })
      .exec();

    if (cached?.igdbIds?.length) {
      const games = await this.findGamesByIgdbIds(cached.igdbIds);
      return { data: this.orderByIds(games, cached.igdbIds).slice(0, limit) };
    }

    const igdbIds = await this.igdbService.getPopularGameIds(limit);
    const igdbGames = await this.igdbService.getGamesByIds(igdbIds);
    const games = await this.upsertMany(igdbGames);

    await this.gameListCacheModel.findOneAndUpdate(
      { key: POPULAR_CACHE_KEY },
      { igdbIds, refreshedAt: new Date() },
      { upsert: true, returnDocument: 'after' },
    );

    return { data: this.orderByIds(games, igdbIds).slice(0, limit) };
  }

  async listGames(
    query: ListGamesQueryDto,
  ): Promise<PaginatedResponse<GameDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortOrder = query.sortOrder ?? SortOrder.DESC;
    const sortField = this.mapSortField(query.sort ?? GameSortField.POPULARITY);

    const filters = this.buildFilters(query);
    const igdbGames = await this.igdbService.searchGames(
      query.q ?? '',
      limit,
      offset,
      sortField,
      sortOrder,
      filters,
    );
    const total = await this.igdbService.countGames(query.q ?? '', filters);
    const data = await this.upsertMany(igdbGames);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getByIgdbId(igdbId: number): Promise<GameDocument> {
    const cached = await this.gameModel.findOne({ igdbId }).exec();
    if (cached) {
      return this.enrichExpectedTimes(cached);
    }

    const igdbGame = await this.igdbService.getGameById(igdbId);
    if (!igdbGame) {
      throw new NotFoundException('Game not found');
    }

    const game = await this.upsertOne(igdbGame);
    return this.enrichExpectedTimes(game);
  }

  async ensureCached(igdbId: number): Promise<GameDocument> {
    return this.getByIgdbId(igdbId);
  }

  async getExpectedTimesFromIgdb(igdbId: number): Promise<IgdbExpectedTimes> {
    const timeToBeat = await this.igdbService.getGameTimeToBeatByGameId(igdbId);
    return mapIgdbTimeToBeatToExpectedTimes(timeToBeat);
  }

  async getGenresMetadata(q?: string) {
    const items = await this.getMetadata(GENRES_CACHE_KEY, () =>
      this.igdbService.getGenres(),
    );
    return this.filterMetadata(items, q);
  }

  async getPlatformsMetadata(q?: string) {
    const items = await this.getMetadata(PLATFORMS_CACHE_KEY, () =>
      this.igdbService.getPlatforms(),
    );
    return this.filterMetadata(items, q);
  }

  private filterMetadata(
    items: { id: number; name: string; slug: string }[],
    q?: string,
  ) {
    const term = q?.trim().toLowerCase();
    if (!term) {
      return items;
    }

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.slug.toLowerCase().includes(term),
    );
  }

  private async getMetadata(
    key: string,
    fetcher: () => Promise<{ id: number; name: string; slug: string }[]>,
  ) {
    const cached = await this.metadataCacheModel.findOne({ key }).exec();
    if (cached?.items?.length) {
      return cached.items;
    }

    const items = await fetcher();
    await this.metadataCacheModel.findOneAndUpdate(
      { key },
      { items, refreshedAt: new Date() },
      { upsert: true, returnDocument: 'after' },
    );

    return items;
  }

  private buildFilters(query: ListGamesQueryDto): string[] {
    const filters: string[] = ['version_parent = null'];

    if (query.genreId) {
      filters.push(`genres = [${query.genreId}]`);
    }

    if (query.platformId) {
      filters.push(`platforms = [${query.platformId}]`);
    }

    if (query.year) {
      const start = Math.floor(
        new Date(`${query.year}-01-01`).getTime() / 1000,
      );
      const end = Math.floor(
        new Date(`${query.year + 1}-01-01`).getTime() / 1000,
      );
      filters.push(
        `first_release_date >= ${start} & first_release_date < ${end}`,
      );
    }

    if (query.minRating !== undefined) {
      filters.push(`total_rating >= ${query.minRating}`);
    }

    return filters;
  }

  private mapSortField(sort: GameSortField): string {
    switch (sort) {
      case GameSortField.NAME:
        return 'name';
      case GameSortField.RELEASE_DATE:
        return 'first_release_date';
      case GameSortField.RATING:
        return 'total_rating';
      case GameSortField.HYPES:
        return 'hypes';
      case GameSortField.POPULARITY:
      default:
        return 'total_rating_count';
    }
  }

  private async upsertMany(igdbGames: IgdbGame[]): Promise<GameDocument[]> {
    return Promise.all(igdbGames.map((game) => this.upsertOne(game)));
  }

  private async upsertOne(igdbGame: IgdbGame): Promise<GameDocument> {
    const payload = this.mapIgdbGame(igdbGame);
    const game = await this.gameModel
      .findOneAndUpdate({ igdbId: igdbGame.id }, payload, {
        upsert: true,
        returnDocument: 'after',
      })
      .exec();

    if (!game) {
      throw new NotFoundException('Failed to cache game');
    }

    return game;
  }

  private async enrichExpectedTimes(game: GameDocument): Promise<GameDocument> {
    if (
      game.expectedTime !== undefined ||
      game.expectedTimeForAllContent !== undefined
    ) {
      return game;
    }

    const times = await this.getExpectedTimesFromIgdb(game.igdbId);
    if (
      times.expectedTime === undefined &&
      times.expectedTimeForAllContent === undefined
    ) {
      return game;
    }

    game.expectedTime = times.expectedTime;
    game.expectedTimeForAllContent = times.expectedTimeForAllContent;
    await game.save();
    return game;
  }

  private mapIgdbGame(igdbGame: IgdbGame) {
    return {
      igdbId: igdbGame.id,
      name: igdbGame.name,
      slug: igdbGame.slug,
      summary: igdbGame.summary,
      coverUrl: igdbGame.cover?.url
        ? igdbGame.cover.url.replace('t_thumb', 't_cover_big')
        : undefined,
      genres: igdbGame.genres?.map((genre) => genre.name) ?? [],
      platforms: igdbGame.platforms?.map((platform) => platform.name) ?? [],
      releaseDate: igdbGame.first_release_date
        ? new Date(igdbGame.first_release_date * 1000)
        : undefined,
      rating: igdbGame.total_rating,
      hypes: igdbGame.hypes,
      raw: igdbGame as Record<string, unknown>,
    };
  }

  private async findGamesByIgdbIds(ids: number[]): Promise<GameDocument[]> {
    return this.gameModel.find({ igdbId: { $in: ids } }).exec();
  }

  private orderByIds(games: GameDocument[], ids: number[]): GameDocument[] {
    const map = new Map(games.map((game) => [game.igdbId, game]));
    return ids
      .map((id) => map.get(id))
      .filter((game): game is GameDocument => !!game);
  }
}
