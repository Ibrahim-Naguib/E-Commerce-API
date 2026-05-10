import type { Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

export const getOverviewStats = async (_req: Request, res: Response) => {
  const [totalUsers, totalOrders, totalProducts] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
  ]);

  const revenueData = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalOrderPrice' } } },
  ]);

  const totalRevenue = revenueData[0]?.totalRevenue ?? 0;

  res.status(200).json({
    status: 'success',
    data: { totalUsers, totalOrders, totalProducts, totalRevenue },
  });
};

export const getSalesStats = async (_req: Request, res: Response) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlySales = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalOrderPrice' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.status(200).json({ status: 'success', data: { monthlySales } });
};

export const getTopProductsStats = async (_req: Request, res: Response) => {
  const topProducts = await Order.aggregate([
    { $unwind: '$cartItems' },
    {
      $group: {
        _id: '$cartItems.product',
        totalSold: { $sum: '$cartItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$cartItems.quantity', '$cartItems.price'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $project: { title: '$product.title', totalSold: 1, totalRevenue: 1 } },
  ]);

  res.status(200).json({ status: 'success', data: { topProducts } });
};
