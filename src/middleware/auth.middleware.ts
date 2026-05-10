import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import type { Env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const protect =
  (env: Env) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(new ApiError('You are not logged in! please log in to get access', 401));
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; iat: number };
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(new ApiError('User does not exist anymore. please sign in again..', 401));
    }

    if (currentUser.passwordChangedAt) {
      const passChangedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
      if (passChangedTimestamp > decoded.iat) {
        return next(
          new ApiError('User recently changed his password. please sign in again..', 401)
        );
      }
    }

    req.user = currentUser as NonNullable<Express.Request['user']>;
    next();
  };

export const allowedTo =
  (...roles: Array<'user' | 'manager' | 'admin'>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError('You are not allowed to access this route', 403));
    }
    next();
  };
