const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: [true, 'Brand name must be unique'],
      minlength: [3, 'Brand name must be at least 3 characters'],
      maxlength: [32, 'Brand name must not be more than 32 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const BrandModel = mongoose.model('Brand', brandSchema);

module.exports = BrandModel;
