const mongoose = require('mongoose');

const subCategoriesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: [true, 'Sub-category name must be unique'],
      minlength: [2, 'Sub-category name must be at least 2 characters'],
      maxlength: [32, 'Sub-category name must not be more than 32 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Sub-category must belong to a category'],
    },
  },
  { timestamps: true }
);

const SubCategory = mongoose.model('SubCategory', subCategoriesSchema);
module.exports = SubCategory;
