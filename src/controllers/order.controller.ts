import mongoose from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { getCartBillableTotal } from '../lib/pricing.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import type { ProductDocument } from '../models/Product.js';
import { decrementStockForLines } from '../services/inventory.service.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteHandler, getAllHandler } from './handlers.js';

export const getAllOrders = getAllHandler(Order);

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!._id;
  const { shippingAddress, paymentMethod } = req.body as {
    shippingAddress: {
      street: string;
      city: string;
      country: string;
      zipCode: string;
    };
    paymentMethod?: string;
    phone?: string;
  };
  const phone = req.body.phone ?? req.user!.phone;

  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'cartItems.product',
    select: 'title price quantity',
  });
  if (!cart || cart.cartItems.length === 0) {
    return next(new ApiError('Cart is empty', 400));
  }

  const lines = cart.cartItems.map((item) => {
    const product = item.product as unknown as ProductDocument;
    return { productId: product._id, quantity: item.quantity };
  });

  const totalOrderPrice = getCartBillableTotal(cart);

  const orderPayload = {
    user: userId,
    cartItems: cart.cartItems.map((item) => {
      const product = item.product as unknown as ProductDocument;
      return {
        product: product._id,
        quantity: item.quantity,
        price: item.price,
        color: item.color,
      };
    }),
    shippingAddress,
    phone,
    paymentMethod: paymentMethod ?? 'cash',
    totalOrderPrice,
    status: 'pending' as const,
    paymentStatus: 'pending' as const,
  };

  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    await decrementStockForLines(session, lines);
    const [order] = await Order.create([orderPayload], { session });
    await Cart.deleteOne({ user: userId }, { session });
    await session.commitTransaction();
    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: { order },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    await session.endSession();
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  const orders = await Order.find({ user: req.user!._id }).sort({ createdAt: -1 }).lean();
  res.status(200).json({ status: 'success', results: orders.length, data: orders });
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id)
    .populate({ path: 'user', select: 'name email phone' })
    .populate({ path: 'cartItems.product', select: 'title price imageCover' })
    .lean();
  if (!order) {
    return next(new ApiError('Order not found', 404));
  }
  const user = order.user as unknown as { _id: mongoose.Types.ObjectId };
  if (
    req.user!.role !== 'admin' &&
    req.user!.role !== 'manager' &&
    user._id.toString() !== req.user!._id.toString()
  ) {
    return next(new ApiError('Not authorized to access this order', 403));
  }
  res.status(200).json({ status: 'success', data: order });
};

export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new ApiError('Please provide data to update the order', 400));
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ApiError('Order not found', 404));
  }
  Object.keys(req.body).forEach((key) => {
    const v = (req.body as Record<string, unknown>)[key];
    if (v !== undefined) {
      (order as unknown as Record<string, unknown>)[key] = v;
    }
  });
  if (req.body.status === 'delivered' && !order.deliveredAt) {
    order.deliveredAt = new Date();
  }
  if (req.body.isPaid === true && !order.paidAt) {
    order.paidAt = new Date();
  }
  await order.save();
  res.status(200).json({ status: 'success', message: 'Order updated successfully', data: order });
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ApiError('Order not found', 404));
  }
  if (
    req.user!.role !== 'admin' &&
    req.user!.role !== 'manager' &&
    order.user.toString() !== req.user!._id.toString()
  ) {
    return next(new ApiError('Not authorized to cancel this order', 403));
  }
  if (order.status === 'delivered' || order.status === 'shipped') {
    return next(new ApiError('Cannot cancel order that is already shipped or delivered', 400));
  }
  order.status = 'canceled';
  await order.save();
  res.status(200).json({ status: 'success', message: 'Order canceled successfully', data: order });
};

export const deleteOrder = deleteHandler(Order);
