import mongoose, { type InferSchemaType, Schema, type Query } from 'mongoose';

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [100, 'Title must not be more than 100 characters long'],
    },
    slug: { type: String, required: true, lowercase: true },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      minlength: [20, 'Description must be at least 20 characters long'],
    },
    quantity: { type: Number, required: [true, 'Product quantity is required'] },
    sold: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      max: [200000, 'Too long price'],
    },
    priceAfterDiscount: Number,
    colors: [String],
    imageCover: { type: String, required: [true, 'Product must have a cover image'] },
    images: [String],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a category'],
    },
    subcategories: [{ type: Schema.Types.ObjectId, ref: 'SubCategory' }],
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be above or equal 1.0'],
      max: [5, 'Rating must be below or equal 5.0'],
    },
    ratingQuantity: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export type ProductAttrs = InferSchemaType<typeof productSchema>;

productSchema.pre(/^find/, function populateCategory(this: Query<unknown, ProductAttrs>, next) {
  void this.populate({ path: 'category', select: 'name -_id' });
  next();
});
export type ProductDocument = mongoose.HydratedDocument<ProductAttrs>;
export const Product = mongoose.model<ProductAttrs>('Product', productSchema);
