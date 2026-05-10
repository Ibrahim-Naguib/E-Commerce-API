import type { Response } from 'express';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import type { Types } from 'mongoose';
import type { Env } from '../config/env.js';

export function generateTokens(env: Env, userId: Types.ObjectId | string) {
  const id = typeof userId === 'string' ? userId : userId.toString();
  const accessToken = jwt.sign({ userId: id }, env.JWT_ACCESS_SECRET as Secret, {
    expiresIn: env.ACCESS_EXPIRE_TIME as SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign({ userId: id }, env.JWT_REFRESH_SECRET as Secret, {
    expiresIn: env.REFRESH_EXPIRE_TIME as SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
}

export function setTokenCookie(res: Response, refreshToken: string, env: Env): void {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearTokenCookies(res: Response, env: Env): void {
  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  };
  res.clearCookie('refreshToken', cookieOptions);
}
