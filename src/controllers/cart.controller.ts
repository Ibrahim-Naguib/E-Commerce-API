import type { NextFunction, Request, Response } from 'express';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

function calcTotalCartPrice(cart: InstanceType<typeof Cart>) {
  let totalPrice = 0;
  for (const item of cart.cartItems) {
    totalPrice += item.quantity * (item.price ?? 0);
  }
  cart.totalCartPrice = totalPrice;
  cart.set('totalPriceAfterDiscount', undefined);
  return totalPrice;
}

export const addProductToCart = async (req: Request, res: Response, next: NextFunction) => {
  const { productId, color } = req.body as { productId: string; color?: string };
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }
  if (product.quantity <= 0) {
    return next(new ApiError('Product is out of stock', 400));
  }

  let cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) {
    cart = await Cart.create({
      user: req.user!._id,
      cartItems: [{ product: productId, color, price: product.price }],
    });
  } else {
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product?.toString() === productId && item.color === color
    );
    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];
      const newQuantity = cartItem.quantity + 1;
      if (product.quantity < newQuantity) {
        return next(new ApiError(`Only ${product.quantity} items available in stock`, 400));
      }
      cartItem.quantity = newQuantity;
      cart.cartItems[productIndex] = cartItem;
    } else {
      if (product.quantity < 1) {
        return next(new ApiError('Insufficient stock available', 400));
      }
      cart.cartItems.push({ product: productId, color, price: product.price });
    }
  }
  calcTotalCartPrice(cart);
  await cart.save();
  res.status(200).json({
    status: 'success',
    message: 'Product added to cart successfully',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
};

export const getLoggedUserCart = async (req: Request, res: Response, next: NextFunction) => {
  const cart = await Cart.findOne({ user: req.user!._id }).lean();
  if (!cart) {
    return next(new ApiError(`There is no cart for this user id: ${req.user!._id.toString()}`, 404));
  }
  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
};

export const removeSpecificCartItem = async (req: Request, res: Response, next: NextFunction) => {
  const cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) {
    return next(new ApiError('Cart not found', 404));
  }
  const itemIndex = cart.cartItems.findIndex((item) => item._id?.toString() === req.params.itemId);
  if (itemIndex === -1) {
    return next(new ApiError(`No cart item found with id: ${req.params.itemId}`, 404));
  }
  cart.cartItems.splice(itemIndex, 1);
  calcTotalCartPrice(cart);
  await cart.save();
  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
};

export const clearCart = async (req: Request, res: Response) => {
  await Cart.findOneAndDelete({ user: req.user!._id });
  res.status(204).send();
};

export const updateCartItemQuantity = async (req: Request, res: Response, next: NextFunction) => {
  const { quantity } = req.body as { quantity: number };
  const cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) {
    return next(new ApiError(`there is no cart for user ${req.user!._id.toString()}`, 404));
  }
  const itemIndex = cart.cartItems.findIndex((item) => item._id?.toString() === req.params.itemId);
  if (itemIndex === -1) {
    return next(new ApiError(`there is no item for this id :${req.params.itemId}`, 404));
  }
  cart.cartItems[itemIndex]!.quantity = quantity;
  calcTotalCartPrice(cart);
  await cart.save();
  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
};

export const applyCoupon = async (req: Request, res: Response, next: NextFunction) => {
  const couponName = (req.body as { coupon?: string }).coupon?.toUpperCase();
  const coupon = await Coupon.findOne({
    name: couponName,
    expire: { $gt: Date.now() },
  });
  if (!coupon) {
    return next(new ApiError('Coupon is invalid or expired', 400));
  }
  const cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) {
    return next(new ApiError('Cart not found', 404));
  }
  calcTotalCartPrice(cart);
  const totalPrice = cart.totalCartPrice ?? 0;
  const totalPriceAfterDiscount = Number((totalPrice - (totalPrice * coupon.discount) / 100).toFixed(2));
  cart.set('totalPriceAfterDiscount', totalPriceAfterDiscount);
  await cart.save();
  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
};

export const syncCart = async (req: Request, res: Response, next: NextFunction) => {
  const { cartItems: localCartItems } = req.body as { cartItems: Array<{ product: string; quantity: number; color?: string }> };
  if (!localCartItems || !Array.isArray(localCartItems)) {
    return next(new ApiError('Cart items are required', 400));
  }
  let cart = await Cart.findOne({ user: req.user!._id }).populate({
    path: 'cartItems.product',
    select: 'title price imageCover quantity',
  });
  if (!cart) {
    cart = await Cart.create({ user: req.user!._id, cartItems: [] });
  }
  for (const localItem of localCartItems) {
    const product = await Product.findById(localItem.product);
    if (!product) continue;
    const existingItemIndex = cart.cartItems.findIndex(
      (item) => item.product?.toString() === localItem.product
    );
    if (existingItemIndex > -1) {
      const existingItem = cart.cartItems[existingItemIndex]!;
      const mergedQuantity = Math.max(existingItem.quantity, localItem.quantity);
      if (product.quantity >= mergedQuantity) {
        existingItem.quantity = mergedQuantity;
        existingItem.price = product.price;
      } else {
        existingItem.quantity = Math.min(mergedQuantity, product.quantity);
      }
    } else {
      const quantityToAdd = Math.min(localItem.quantity, product.quantity);
      if (quantityToAdd > 0) {
        cart.cartItems.push({
          product: localItem.product,
          quantity: quantityToAdd,
          price: product.price,
          color: localItem.color,
        });
      }
    }
  }
  calcTotalCartPrice(cart);
  await cart.save();
  await cart.populate({ path: 'cartItems.product', select: 'title price imageCover quantity' });
  res.status(200).json({
    status: 'success',
    message: 'Cart synced successfully',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
};
