import type { Model } from 'mongoose';
import type { Request, Response, NextFunction } from 'express';
import { ApiFeatures, type QueryString } from '../lib/apiFeatures.js';
import { ApiError } from '../utils/ApiError.js';

export const getAllHandler =
  <T>(Model: Model<T>, modelName = '') =>
  async (req: Request, res: Response) => {
    let filter: Record<string, unknown> = {};
    if (req.filterObject) filter = req.filterObject;
    const apiFeatures = new ApiFeatures(Model.find(filter), req.query as QueryString)
      .filter()
      .search(modelName)
      .sort()
      .limitFields();
    const documentsCount = await apiFeatures.mongooseQuery.clone().countDocuments();
    apiFeatures.paginate(documentsCount);

    const { mongooseQuery, paginationData } = apiFeatures;
    const documents = await mongooseQuery.lean();
    res.status(200).json({ results: documents.length, paginationData, data: documents });
  };

export const getByIdHandler =
  <T>(Model: Model<T>, resourceName: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const document = await Model.findById(id).lean();
    if (!document) {
      return next(new ApiError(`No ${resourceName} found for this id ${id}`, 404));
    }
    res.status(200).json({ data: document });
  };

export const createHandler =
  <T>(Model: Model<T>) =>
  async (req: Request, res: Response) => {
    const newDocument = await Model.create(req.body);
    res.status(201).json({ data: newDocument });
  };

export const updateHandler =
  <T>(Model: Model<T>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!document) {
      return next(new ApiError(`No document found for this id ${req.params.id}`, 404));
    }
    res.status(200).json({ data: document });
  };

export const deleteHandler =
  <T>(Model: Model<T>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const document = await Model.findByIdAndDelete(id);
    if (!document) {
      return next(new ApiError(`No document found for this id ${id}`, 404));
    }
    res.status(204).send();
  };
