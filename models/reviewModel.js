const mongoose = require('mongoose');
const Product = require('./productModel');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
    },
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

// Prevent user from reviewing the same product twice
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to calculate average ratings for a product
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
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
      ratingsAverage: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal place
      ratingQuantity: stats[0].numOfRatings,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingQuantity: 0,
    });
  }
};

// Update product ratings after saving a review
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

// Update product ratings after removing a review
reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.product);
  }
});

// Pre middleware to get the review document for post middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
