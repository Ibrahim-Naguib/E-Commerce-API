import mongoose, { type InferSchemaType, Schema } from 'mongoose';
import { Product } from './Product.js';

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Review must belong to a user'] },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: [true, 'Review must belong to a product'] },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must not exceed 5'],
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [500, 'Review comment cannot exceed 500 characters'],
    },
  },
  { timestamps: true, versionKey: false }
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function calcAverageRatings(productId: mongoose.Types.ObjectId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numOfRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
      ratingQuantity: stats[0].numOfRatings,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingQuantity: 0,
    });
  }
};

reviewSchema.post('save', function postSaveReview() {
  const Model = this.constructor as typeof Review;
  void Model.calcAverageRatings(this.product as mongoose.Types.ObjectId);
});

export type ReviewAttrs = InferSchemaType<typeof reviewSchema>;
export type ReviewDocument = mongoose.HydratedDocument<ReviewAttrs>;

type ReviewModel = mongoose.Model<ReviewAttrs> & {
  calcAverageRatings: (productId: mongoose.Types.ObjectId) => Promise<void>;
};

export const Review = mongoose.model<ReviewAttrs, ReviewModel>('Review', reviewSchema);
