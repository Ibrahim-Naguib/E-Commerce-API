import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import type { Env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { toPublicUser } from '../utils/publicUser.js';
import { sendEmail } from '../utils/sendEmail.js';
import {
  clearTokenCookies,
  generateTokens,
  setTokenCookie,
} from '../utils/tokens.js';

export function buildAuthController(env: Env) {
  const signup = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return next(new ApiError('Email already exists', 400));
    }
    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(env, user._id);
    setTokenCookie(res, refreshToken, env);
    const u = toPublicUser({ user });
    res.status(201).json({ data: u, accessToken });
  };

  const signin = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email }).select('+password').lean();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new ApiError('Incorrect email or password', 401));
    }
    const { accessToken, refreshToken } = generateTokens(env, user._id);
    setTokenCookie(res, refreshToken, env);
    const u = toPublicUser({ user });
    res.status(200).json({ data: u, accessToken });
  };

  const signout = async (_req: Request, res: Response) => {
    clearTokenCookies(res, env);
    res.status(200).json({ message: 'Logged out successfully' });
  };

  const refresh = async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.cookies as { refreshToken?: string };
    if (!refreshToken) {
      return next(new ApiError('No refresh token provided', 401));
    }
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
      };
    } catch {
      clearTokenCookies(res, env);
      return next(new ApiError('Invalid refresh token', 403));
    }
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      clearTokenCookies(res, env);
      return next(new ApiError('User no longer exists', 401));
    }
    const { accessToken, refreshToken: newRefresh } = generateTokens(
      env,
      user._id,
    );
    setTokenCookie(res, newRefresh, env);
    res.status(200).json({ accessToken });
  };

  const forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const user = await User.findOne({
      email: (req.body as { email: string }).email,
    });
    if (!user) {
      return next(
        new ApiError(
          `There is no user with that email ${(req.body as { email: string }).email}`,
          404,
        ),
      );
    }
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');
    user.passwordResetCode = hashedResetCode;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetVerified = false;
    await user.save();

    const message = `Hi ${user.name},\n We received a request to reset the password on your E-shop Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-shop Team`;
    try {
      await sendEmail(env, {
        email: user.email,
        subject: 'Your password reset code (valid for 10 min)',
        message,
      });
    } catch {
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      user.passwordResetVerified = undefined;
      await user.save();
      return next(new ApiError('There is an error in sending email', 500));
    }
    res
      .status(200)
      .json({ status: 'Success', message: 'Reset code sent to email' });
  };

  const verifyPassResetCode = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const hashedResetCode = crypto
      .createHash('sha256')
      .update(String((req.body as { resetCode: string }).resetCode))
      .digest('hex');
    const user = await User.findOne({
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return next(new ApiError('Reset code invalid or expired', 400));
    }
    user.passwordResetVerified = true;
    await user.save();
    res.status(200).json({ status: 'Success' });
  };

  const resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, newPassword } = req.body as {
      email: string;
      newPassword: string;
    };
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(`There is no user with email ${email}`, 404));
    }
    if (!user.passwordResetVerified) {
      return next(new ApiError('Reset code not verified', 400));
    }
    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    const { accessToken, refreshToken } = generateTokens(env, user._id);
    setTokenCookie(res, refreshToken, env);
    res.status(200).json({ accessToken });
  };

  return {
    signup,
    signin,
    signout,
    refresh,
    forgotPassword,
    verifyPassResetCode,
    resetPassword,
  };
}
