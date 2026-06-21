import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IgdbCountResponse,
  IgdbGame,
  IgdbGameTimeToBeat,
  IgdbMetadataItem,
  IgdbPopularityPrimitive,
} from './igdb.types';

@Injectable()
export class IgdbService {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {}

  async searchGames(
    query: string,
    limit: number,
    offset: number,
    sortField: string,
    sortOrder: 'asc' | 'desc',
    filters: string[],
  ): Promise<IgdbGame[]> {
    const whereClause = filters.length ? `where ${filters.join(' & ')};` : '';
    const searchClause = query ? `search "${query.replace(/"/g, '')}";` : '';
    const body = `
      fields id,name,slug,summary,cover.url,genres.name,platforms.name,first_release_date,total_rating,hypes;
      ${searchClause}
      ${whereClause}
      sort ${sortField} ${sortOrder};
      limit ${limit};
      offset ${offset};
    `;

    return this.request<IgdbGame[]>('/games', body);
  }

  async countGames(query: string, filters: string[]): Promise<number> {
    const whereClause = filters.length ? `where ${filters.join(' & ')};` : '';
    const searchClause = query ? `search "${query.replace(/"/g, '')}";` : '';
    const body = `
      ${searchClause}
      ${whereClause}
    `;

    const result = await this.request<IgdbCountResponse>('/games/count', body);
    return result.count;
  }

  async getGamesByIds(ids: number[]): Promise<IgdbGame[]> {
    if (!ids.length) {
      return [];
    }

    const body = `
      fields id,name,slug,summary,cover.url,genres.name,platforms.name,first_release_date,total_rating,hypes;
      where id = (${ids.join(',')});
      limit ${ids.length};
    `;

    return this.request<IgdbGame[]>('/games', body);
  }

  async getGameById(id: number): Promise<IgdbGame | null> {
    const games = await this.getGamesByIds([id]);
    return games[0] ?? null;
  }

  async getPopularGameIds(limit: number): Promise<number[]> {
    const body = `
      fields game_id,value,popularity_type;
      sort value desc;
      limit ${limit * 3};
    `;

    const primitives = await this.request<IgdbPopularityPrimitive[]>(
      '/popularity_primitives',
      body,
    );

    const seen = new Set<number>();
    const ids: number[] = [];

    for (const primitive of primitives) {
      if (seen.has(primitive.game_id)) {
        continue;
      }
      seen.add(primitive.game_id);
      ids.push(primitive.game_id);
      if (ids.length >= limit) {
        break;
      }
    }

    return ids;
  }

  async getGenres(): Promise<IgdbMetadataItem[]> {
    const body = 'fields id,name,slug; limit 500; sort name asc;';
    return this.request<IgdbMetadataItem[]>('/genres', body);
  }

  async getPlatforms(): Promise<IgdbMetadataItem[]> {
    const body = 'fields id,name,slug; limit 500; sort name asc;';
    return this.request<IgdbMetadataItem[]>('/platforms', body);
  }

  async getGameTimeToBeatByGameId(
    igdbId: number,
  ): Promise<IgdbGameTimeToBeat | null> {
    const body = `
      fields game_id,hastily,normally,completely;
      where game_id = ${igdbId};
      limit 1;
    `;

    const results = await this.request<IgdbGameTimeToBeat[]>(
      '/game_time_to_beats',
      body,
    );

    return results[0] ?? null;
  }

  private async request<T>(endpoint: string, body: string): Promise<T> {
    const token = await this.getAccessToken();
    const clientId = this.configService.get<string>('igdb.clientId', '');

    const response = await fetch(`https://api.igdb.com/v4${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: body.trim(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ServiceUnavailableException(
        `IGDB request failed (${response.status}): ${errorText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('igdb.clientId', '');
    const clientSecret = this.configService.get<string>(
      'igdb.clientSecret',
      '',
    );

    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'IGDB credentials are not configured',
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    });

    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?${params.toString()}`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Failed to obtain IGDB access token',
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken;
  }
}
