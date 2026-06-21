import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { GameStatus } from '../common/enums/game-status.enum';
import { GamesService } from '../games/games.service';
import { CreateUserGameDto } from './dto/create-user-game.dto';
import { UpdateUserGameDto } from './dto/update-user-game.dto';
import { UserGame, UserGameDocument, gamePopulate } from './schemas/user-game.schema';

@Injectable()
export class UserGamesService {
  constructor(
    @InjectModel(UserGame.name)
    private readonly userGameModel: Model<UserGameDocument>,
    private readonly gamesService: GamesService,
  ) {}

  async findAll(
    userId: string,
    page = 1,
    limit = 20,
    status?: GameStatus,
  ): Promise<PaginatedResponse<UserGameDocument>> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userGameModel
        .find(filter)
        .populate(gamePopulate)
        .skip(skip)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .exec(),
      this.userGameModel.countDocuments(filter),
    ]);

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

  async getCounts(userId: string): Promise<Record<GameStatus, number>> {
    const counts = Object.values(GameStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<GameStatus, number>,
    );

    const aggregation = await this.userGameModel.aggregate<{
      _id: GameStatus;
      count: number;
    }>([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    for (const item of aggregation) {
      if (item._id in counts) {
        counts[item._id] = item.count;
      }
    }

    return counts;
  }

  async findOne(userId: string, id: string): Promise<UserGameDocument> {
    const userGame = await this.userGameModel
      .findById(id)
      .populate(gamePopulate)
      .exec();

    if (!userGame) {
      throw new NotFoundException('User game not found');
    }

    this.assertOwnership(userId, userGame);
    return userGame;
  }

  async create(
    userId: string,
    dto: CreateUserGameDto,
  ): Promise<UserGameDocument> {
    const existing = await this.userGameModel.findOne({
      userId: new Types.ObjectId(userId),
      igdbId: dto.igdbId,
    });

    if (existing) {
      throw new ConflictException('Game already in backlog');
    }

    const game = await this.gamesService.ensureCached(dto.igdbId);
    const igdbExpectedTimes = await this.fetchIgdbExpectedTimes(dto.igdbId);

    const userGame = await this.userGameModel.create({
      userId: new Types.ObjectId(userId),
      igdbId: dto.igdbId,
      gameId: game._id,
      status: GameStatus.WANT_TO_PLAY_NEXT,
      notes: '',
      expectedTime: igdbExpectedTimes.expectedTime,
      expectedTimeForAllContent: igdbExpectedTimes.expectedTimeForAllContent,
    });

    return userGame.populate(gamePopulate);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateUserGameDto,
  ): Promise<UserGameDocument> {
    const userGame = await this.userGameModel.findById(id).exec();
    if (!userGame) {
      throw new NotFoundException('User game not found');
    }

    this.assertOwnership(userId, userGame);

    if (dto.status !== undefined) userGame.status = dto.status;

    if (dto.notes !== undefined) userGame.notes = dto.notes;

    if (dto.expectedTime !== undefined)
      userGame.expectedTime = dto.expectedTime;

    if (dto.expectedTimeForAllContent !== undefined) {
      userGame.expectedTimeForAllContent = dto.expectedTimeForAllContent;
    }

    if (dto.playedTime !== undefined) userGame.playedTime = dto.playedTime;

    if (dto.playedTimeForAllContent !== undefined) {
      userGame.playedTimeForAllContent = dto.playedTimeForAllContent;
    }

    if (dto.finishedType !== undefined)
      userGame.finishedType = dto.finishedType;
    
    if (dto.startDate !== undefined)
      userGame.startDate = new Date(dto.startDate);

    if (dto.endDate !== undefined) userGame.endDate = new Date(dto.endDate);

    if (dto.endDateForAllContent !== undefined) {
      userGame.endDateForAllContent = new Date(dto.endDateForAllContent);
    }

    if (dto.availability !== undefined)
      userGame.availability = dto.availability;

    await userGame.save();
    return userGame.populate(gamePopulate);
  }

  async remove(userId: string, id: string): Promise<void> {
    const userGame = await this.userGameModel.findById(id).exec();
    if (!userGame) {
      throw new NotFoundException('User game not found');
    }

    this.assertOwnership(userId, userGame);
    await userGame.deleteOne();
  }

  private assertOwnership(userId: string, userGame: UserGameDocument): void {
    if (String(userGame.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this resource');
    }
  }

  private async fetchIgdbExpectedTimes(igdbId: number) {
    try {
      return await this.gamesService.getExpectedTimesFromIgdb(igdbId);
    } catch {
      return {};
    }
  }
}
