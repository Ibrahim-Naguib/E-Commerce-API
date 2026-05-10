import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Order must belong to a user'] },
    cartItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'Product is required in order items'],
        },
        quantity: Number,
        color: String,
        price: Number,
      },
    ],
    shippingAddress: {
      street: { type: String, required: [true, 'Street address is required'] },
      city: { type: String, required: [true, 'City is required'] },
      country: { type: String, required: [true, 'Country is required'] },
      zipCode: { type: String, required: [true, 'ZIP code is required'] },
    },
    phone: String,
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['cash', 'card', 'paypal', 'stripe'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'canceled'],
      default: 'pending',
    },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    totalOrderPrice: Number,
    deliveredAt: Date,
    stripeSessionId: { type: String, sparse: true, unique: true },
    stripePaymentIntentId: String,
  },
  { timestamps: true, versionKey: false }
);

export type OrderAttrs = InferSchemaType<typeof orderSchema>;
export type OrderDocument = mongoose.HydratedDocument<OrderAttrs>;
export const Order = mongoose.model<OrderAttrs>('Order', orderSchema);
