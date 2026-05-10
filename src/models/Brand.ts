import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      minlength: [3, 'Brand name must be at least 3 characters'],
      maxlength: [32, 'Brand name must not be more than 32 characters'],
    },
    slug: { type: String, lowercase: true },
    image: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export type BrandAttrs = InferSchemaType<typeof brandSchema>;
export type BrandDocument = mongoose.HydratedDocument<BrandAttrs>;
export const Brand = mongoose.model<BrandAttrs>('Brand', brandSchema);
