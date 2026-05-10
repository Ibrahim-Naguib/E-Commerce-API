import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    color: String,
    price: Number,
  },
  { timestamps: false, _id: true }
);

const cartSchema = new Schema(
  {
    cartItems: [cartItemSchema],
    totalCartPrice: Number,
    totalPriceAfterDiscount: { type: Schema.Types.Mixed },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false }
);

export type CartAttrs = InferSchemaType<typeof cartSchema>;
export type CartDocument = mongoose.HydratedDocument<CartAttrs>;
export const Cart = mongoose.model<CartAttrs>('Cart', cartSchema);
