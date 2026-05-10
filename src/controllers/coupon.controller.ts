import type { NextFunction, Request, Response } from 'express';
import { Coupon } from '../models/Coupon.js';
import { ApiError } from '../utils/ApiError.js';
import { createHandler, deleteHandler, getAllHandler, getByIdHandler, updateHandler } from './handlers.js';

export const getCoupons = getAllHandler(Coupon, '');
export const getCoupon = getByIdHandler(Coupon, 'coupon');
export const createCoupon = createHandler(Coupon);
export const updateCoupon = updateHandler(Coupon);
export const deleteCoupon = deleteHandler(Coupon);

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  const { couponName } = req.body as { couponName?: string };
  if (!couponName) {
    return next(new ApiError('Coupon name is required', 400));
  }
  const coupon = await Coupon.findOne({
    name: couponName.toUpperCase(),
    expire: { $gt: Date.now() },
  });
  if (!coupon) {
    return next(new ApiError('Invalid or expired coupon', 400));
  }
  res.status(200).json({
    status: 'success',
    data: { name: coupon.name, discount: coupon.discount, expire: coupon.expire },
  });
};
