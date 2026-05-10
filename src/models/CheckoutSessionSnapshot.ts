import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const snapshotLineSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const checkoutSessionSnapshotSchema = new Schema(
  {
    stripeSessionId: { type: String, required: true, unique: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lines: {
      type: [snapshotLineSchema],
      required: true,
      validate: [(v: unknown[]) => Array.isArray(v) && v.length > 0, 'Checkout snapshot must include line items'],
    },
  },
  { timestamps: true, versionKey: false }
);

export type CheckoutSessionSnapshotAttrs = InferSchemaType<typeof checkoutSessionSnapshotSchema>;
export const CheckoutSessionSnapshot = mongoose.model<CheckoutSessionSnapshotAttrs>(
  'CheckoutSessionSnapshot',
  checkoutSessionSnapshotSchema
);
