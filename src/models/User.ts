import bcrypt from 'bcryptjs';
import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, trim: true, required: [true, 'Name is required'] },
    slug: { type: String, lowercase: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    phone: String,
    profileImg: String,
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ['user', 'manager', 'admin'],
      default: 'user',
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDocument = mongoose.HydratedDocument<UserAttrs>;

export const User = mongoose.model<UserAttrs>('User', userSchema);
