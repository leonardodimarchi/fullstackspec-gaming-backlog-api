import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { applyBaseSchemaOptions } from '../../common/schemas/base.schema';

export type GameDocument = HydratedDocument<Game>;

@Schema({ collection: 'games' })
export class Game {
  @Prop({ required: true, unique: true, index: true })
  igdbId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  summary?: string;

  @Prop()
  coverUrl?: string;

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ type: [String], default: [] })
  platforms: string[];

  @Prop()
  releaseDate?: Date;

  @Prop()
  rating?: number;

  @Prop()
  hypes?: number;

  @Prop()
  expectedTime?: number;

  @Prop()
  expectedTimeForAllContent?: number;

  @Prop({ type: Object })
  raw?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);
applyBaseSchemaOptions(GameSchema);
