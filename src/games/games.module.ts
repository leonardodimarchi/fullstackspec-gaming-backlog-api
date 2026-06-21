import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { IgdbService } from './igdb/igdb.service';
import {
  GameListCache,
  GameListCacheSchema,
} from './schemas/game-list-cache.schema';
import {
  MetadataCache,
  MetadataCacheSchema,
} from './schemas/metadata-cache.schema';
import { Game, GameSchema } from './schemas/game.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: GameListCache.name, schema: GameListCacheSchema },
      { name: MetadataCache.name, schema: MetadataCacheSchema },
    ]),
  ],
  controllers: [GamesController],
  providers: [GamesService, IgdbService],
  exports: [GamesService],
})
export class GamesModule {}
