import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { applyBaseSchemaOptions } from '../../common/schemas/base.schema';

export type MetadataCacheDocument = HydratedDocument<MetadataCache>;

export interface MetadataItem {
  id: number;
  name: string;
  slug: string;
}

@Schema({ collection: 'metadata_cache' })
export class MetadataCache {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ type: [Object], default: [] })
  items: MetadataItem[];

  @Prop()
  refreshedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const MetadataCacheSchema = SchemaFactory.createForClass(MetadataCache);
applyBaseSchemaOptions(MetadataCacheSchema);
