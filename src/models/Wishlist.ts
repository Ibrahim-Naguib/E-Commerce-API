import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Wishlist must belong to a user'] },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Wishlist item must be a product'],
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

wishlistSchema.index({ user: 1 }, { unique: true });

export type WishlistAttrs = InferSchemaType<typeof wishlistSchema>;
export type WishlistDocument = mongoose.HydratedDocument<WishlistAttrs>;
export const Wishlist = mongoose.model<WishlistAttrs>('Wishlist', wishlistSchema);
