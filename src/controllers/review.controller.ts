import type { NextFunction, Request, Response } from 'express';
import type { Types } from 'mongoose';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { createHandler, getAllHandler, getByIdHandler } from './handlers.js';

export const setProductAndUserIds = (req: Request, _res: Response, next: NextFunction) => {
  const body = req.body as Record<string, unknown>;
  if (!body.product && req.params.productId) body.product = req.params.productId;
  if (!body.user) body.user = req.user!._id;
  next();
};

export const createFilterObject = (req: Request, _res: Response, next: NextFunction) => {
  if (req.params.productId) {
    req.filterObject = { product: req.params.productId };
  }
  next();
};

export const checkExistingReview = async (req: Request, _res: Response, next: NextFunction) => {
  const body = req.body as { product?: string };
  const existingReview = await Review.findOne({
    user: req.user!._id,
    product: body.product,
  });
  if (existingReview) {
    return next(new ApiError('You have already reviewed this product', 400));
  }
  next();
};

export const checkReviewOwnership = async (req: Request, _res: Response, next: NextFunction) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new ApiError('Review not found', 404));
  }
  if (
    req.user!.role !== 'admin' &&
    req.user!.role !== 'manager' &&
    review.user.toString() !== req.user!._id.toString()
  ) {
    return next(new ApiError('Not authorized to modify this review', 403));
  }
  req.reviewDoc = review;
  next();
};

export const getReviews = getAllHandler(Review, '');
export const getReview = getByIdHandler(Review, 'review');

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as { product?: string };
  const product = await Product.findById(body.product);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }
  return createHandler(Review)(req, res);
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  const review = req.reviewDoc!;
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new ApiError('Please provide data to update the review', 400));
  }
  Object.assign(review, req.body);
  const updatedReview = await review.save();
  res.status(200).json({ data: updatedReview });
};

export const deleteReview = async (req: Request, res: Response) => {
  const review = req.reviewDoc!;
  const productId = review.product as Types.ObjectId;
  await review.deleteOne();
  await Review.calcAverageRatings(productId);
  res.status(204).send();
};

export const getMyReviews = async (req: Request, res: Response) => {
  const reviews = await Review.find({ user: req.user!._id })
    .populate({ path: 'product', select: 'title imageCover' })
    .sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: reviews.length, data: reviews });
};
