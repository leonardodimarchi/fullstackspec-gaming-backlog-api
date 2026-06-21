import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { applyBaseSchemaOptions } from '../../common/schemas/base.schema';

export type GameListCacheDocument = HydratedDocument<GameListCache>;

@Schema({ collection: 'game_list_cache' })
export class GameListCache {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ type: [Number], default: [] })
  igdbIds: number[];

  @Prop()
  refreshedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const GameListCacheSchema = SchemaFactory.createForClass(GameListCache);
applyBaseSchemaOptions(GameListCacheSchema);
