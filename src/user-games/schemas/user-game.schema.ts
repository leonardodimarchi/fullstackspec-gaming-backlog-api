import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Availability } from '../../common/enums/availability.enum';
import { FinishedType } from '../../common/enums/finished-type.enum';
import { GameStatus } from '../../common/enums/game-status.enum';
import { applyBaseSchemaOptions } from '../../common/schemas/base.schema';
import { Game } from '../../games/schemas/game.schema';
import { User } from '../../users/schemas/user.schema';

export type UserGameDocument = HydratedDocument<UserGame>;

@Schema({ collection: 'user_games' })
export class UserGame {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  igdbId: number;

  @Prop({ type: Types.ObjectId, ref: Game.name })
  gameId?: Types.ObjectId;

  @Prop({ required: true, enum: GameStatus })
  status: GameStatus;

  @Prop({ default: '' })
  notes: string;

  @Prop()
  expectedTime?: number;

  @Prop()
  expectedTimeForAllContent?: number;

  @Prop()
  playedTime?: number;

  @Prop()
  playedTimeForAllContent?: number;

  @Prop({ enum: FinishedType })
  finishedType?: FinishedType;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  endDateForAllContent?: Date;

  @Prop({ enum: Availability })
  availability?: Availability;

  createdAt: Date;
  updatedAt: Date;
}

export const UserGameSchema = SchemaFactory.createForClass(UserGame);
UserGameSchema.virtual('game', {
  ref: Game.name,
  localField: 'gameId',
  foreignField: '_id',
  justOne: true,
});
applyBaseSchemaOptions(UserGameSchema);
UserGameSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    const output = ret as unknown as Record<string, unknown>;
    output.id = output._id;
    delete output._id;
    delete output.__v;
    delete output.gameId;

    const game = output.game as Record<string, unknown> | undefined;
    if (game) {
      game.id = game._id;
      delete game._id;
      delete game.__v;
      delete game.raw;
    }

    return output;
  },
});
UserGameSchema.set('toObject', { virtuals: true });
UserGameSchema.index({ userId: 1, igdbId: 1 }, { unique: true });

const gamePopulate = { path: 'game', select: '-raw' } as const;
export { gamePopulate };
