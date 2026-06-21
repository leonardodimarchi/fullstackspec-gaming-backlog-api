import { Schema } from 'mongoose';

export function applyBaseSchemaOptions(schema: Schema): void {
  schema.set('timestamps', true);
  schema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
  schema.set('toObject', { virtuals: true });
}
