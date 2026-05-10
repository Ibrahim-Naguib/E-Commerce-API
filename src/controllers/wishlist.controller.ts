import type { NextFunction, Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/ApiError.js';

export const getWishlist = async (req: Request, res: Response) => {
  const wishlist = await Wishlist.findOne({ user: req.user!._id }).populate({
    path: 'products',
    select: 'title price imageCover ratingsAverage',
  }).lean();
  if (!wishlist) {
    const createdWishlist = await Wishlist.create({ user: req.user!._id, products: [] });
    res.status(200).json({
      status: 'success',
      results: createdWishlist.products.length,
      data: createdWishlist,
    });
    return;
  }
  res.status(200).json({
    status: 'success',
    results: wishlist.products.length,
    data: wishlist,
  });
};

export const addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }
  let wishlist = await Wishlist.findOne({ user: req.user!._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user!._id, products: [productId] });
  } else {
    const has = wishlist.products.some((p) => p.toString() === productId);
    if (has) {
      return next(new ApiError('Product already in wishlist', 400));
    }
    wishlist.products.push(productId as unknown as (typeof wishlist.products)[number]);
    await wishlist.save();
  }
  await wishlist.populate({
    path: 'products',
    select: 'title price imageCover ratingsAverage',
  });
  res.status(200).json({
    status: 'success',
    message: 'Product added to wishlist successfully',
    data: wishlist,
  });
};

export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
  const { productId } = req.params;
  const wishlist = await Wishlist.findOne({ user: req.user!._id });
  if (!wishlist) {
    return next(new ApiError('Wishlist not found', 404));
  }
  const has = wishlist.products.some((p) => p.toString() === productId);
  if (!has) {
    return next(new ApiError('Product not found in wishlist', 404));
  }
  wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
  await wishlist.save();
  await wishlist.populate({
    path: 'products',
    select: 'title price imageCover ratingsAverage',
  });
  res.status(200).json({
    status: 'success',
    message: 'Product removed from wishlist successfully',
    data: wishlist,
  });
};

export const clearWishlist = async (req: Request, res: Response, next: NextFunction) => {
  const wishlist = await Wishlist.findOne({ user: req.user!._id });
  if (!wishlist) {
    return next(new ApiError('Wishlist not found', 404));
  }
  wishlist.products = [];
  await wishlist.save();
  await wishlist.populate({
    path: 'products',
    select: 'title price imageCover ratingsAverage',
  });
  res.status(200).json({
    status: 'success',
    message: 'Wishlist cleared successfully',
    data: wishlist,
  });
};

export const checkProductInWishlist = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const wishlist = await Wishlist.findOne({ user: req.user!._id }).lean();
  const isInWishlist = wishlist ? wishlist.products.some((p) => p.toString() === productId) : false;
  res.status(200).json({ status: 'success', data: { productId, isInWishlist } });
};
