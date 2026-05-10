import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const couponSchema = new Schema(
  {
    name: { type: String, trim: true, required: [true, 'Coupon name required'], unique: true },
    expire: { type: Date, required: [true, 'Coupon expire time required'] },
    discount: { type: Number, required: [true, 'Coupon discount value required'] },
  },
  { timestamps: true, versionKey: false }
);

export type CouponAttrs = InferSchemaType<typeof couponSchema>;
export type CouponDocument = mongoose.HydratedDocument<CouponAttrs>;
export const Coupon = mongoose.model<CouponAttrs>('Coupon', couponSchema);
