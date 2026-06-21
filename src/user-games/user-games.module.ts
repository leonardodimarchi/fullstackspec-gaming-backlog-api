import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesModule } from '../games/games.module';
import { UserGame, UserGameSchema } from './schemas/user-game.schema';
import { UserGamesController } from './user-games.controller';
import { UserGamesService } from './user-games.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserGame.name, schema: UserGameSchema },
    ]),
    GamesModule,
  ],
  controllers: [UserGamesController],
  providers: [UserGamesService],
})
export class UserGamesModule {}
