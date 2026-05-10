import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      minlength: [3, 'Category name must be at least 3 characters'],
      maxlength: [32, 'Category name must not be more than 32 characters'],
    },
    slug: { type: String, lowercase: true },
    image: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export type CategoryAttrs = InferSchemaType<typeof categorySchema>;
export type CategoryDocument = mongoose.HydratedDocument<CategoryAttrs>;
export const Category = mongoose.model<CategoryAttrs>('Category', categorySchema);
