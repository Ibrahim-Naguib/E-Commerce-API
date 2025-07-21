const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Wishlist must belong to a user'],
    },
    products: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Wishlist item must be a product'],
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

// Ensure one wishlist per user
wishlistSchema.index({ user: 1 }, { unique: true });

// Populate products when querying
wishlistSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'products',
    select: 'title price imageCover ratingsAverage',
  });
  next();
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
