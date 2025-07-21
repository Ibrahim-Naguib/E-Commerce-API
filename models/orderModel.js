const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
    },
    cartItems: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: [true, 'Product is required in order items'],
        },
        quantity: Number,
        color: String,
        price: Number,
      },
    ],
    shippingAddress: {
      type: String,
      required: [true, 'Shipping address is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },

    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['cash', 'card', 'paypal'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'canceled'],
      default: 'pending',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    totalOrderPrice: Number,
    deliveredAt: Date,
  },
  { timestamps: true, versionKey: false }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
