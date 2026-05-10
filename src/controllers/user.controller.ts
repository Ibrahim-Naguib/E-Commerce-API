import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import { ApiFeatures } from '../lib/apiFeatures.js';
import type { QueryString } from '../lib/apiFeatures.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { toPublicUser } from '../utils/publicUser.js';
import { generateTokens, setTokenCookie } from '../utils/tokens.js';
import type { Env } from '../config/env.js';
import { deleteHandler } from './handlers.js';

export function buildUserController(env: Env) {
  const getUsers = async (req: Request, res: Response) => {
    let filter: Record<string, unknown> = {};
    if (req.filterObject) filter = req.filterObject;
    const documentsCount = await User.countDocuments(filter);
    const apiFeatures = new ApiFeatures(
      User.find(filter).select('-password'),
      req.query as QueryString,
    )
      .filter()
      .search('User')
      .sort()
      .limitFields()
      .paginate(documentsCount);
    const { mongooseQuery, paginationData } = apiFeatures;
    const documents = await mongooseQuery.lean();
    res
      .status(200)
      .json({ results: documents.length, paginationData, data: documents });
  };

  const getUser = async (req: Request, res: Response, next: NextFunction) => {
    const document = await User.findById(req.params.id)
      .select('-password')
      .lean();
    if (!document) {
      return next(
        new ApiError(`No user found for this id ${req.params.id}`, 404),
      );
    }
    res.status(200).json({ data: document });
  };

  const createUser = async (req: Request, res: Response) => {
    const newDocument = await User.create(req.body);
    const u = toPublicUser({ user: newDocument });
    res.status(201).json({ data: u });
  };

  const updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const body = req.body as Record<string, unknown>;
    const document = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: body.name,
        slug: body.slug,
        phone: body.phone,
        email: body.email,
        profileImg: body.profileImg,
        role: body.role,
      },
      { new: true },
    );
    if (!document) {
      return next(
        new ApiError(`No user found for this id ${req.params.id}`, 404),
      );
    }
    res.status(200).json({ data: document });
  };

  const changeUserPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const document = await User.findByIdAndUpdate(
      req.params.id,
      {
        password: await bcrypt.hash(
          (req.body as { password: string }).password,
          12,
        ),
        passwordChangedAt: new Date(),
      },
      { new: true },
    );
    if (!document) {
      return next(
        new ApiError(`No user found for this id ${req.params.id}`, 404),
      );
    }
    res.status(200).json({ data: document });
  };

  const deleteUser = deleteHandler(User);

  const getLoggedUserData = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    req.params.id = req.user!._id.toString();
    next();
  };

  const updateLoggedUserPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        password: await bcrypt.hash(
          (req.body as { password: string }).password,
          12,
        ),
        passwordChangedAt: new Date(),
      },
      { new: true },
    );
    if (!user) {
      return next(new ApiError('User not found', 404));
    }
    const { accessToken, refreshToken } = generateTokens(env, user._id);
    setTokenCookie(res, refreshToken, env);
    const u = toPublicUser({ user });
    res.status(200).json({ data: u, accessToken });
  };

  const updateLoggedUserData = async (req: Request, res: Response) => {
    const body = req.body as { name?: string; email?: string; phone?: string };
    const updatedUser = await User.findByIdAndUpdate(
      req.user!._id,
      { name: body.name, email: body.email, phone: body.phone },
      { new: true },
    );
    res.status(200).json({ data: updatedUser });
  };

  const deleteLoggedUserData = async (req: Request, res: Response) => {
    await User.findByIdAndUpdate(req.user!._id, { active: false });
    res.status(204).send();
  };

  return {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getLoggedUserData,
    updateLoggedUserPassword,
    updateLoggedUserData,
    deleteLoggedUserData,
    changeUserPassword,
  };
}
