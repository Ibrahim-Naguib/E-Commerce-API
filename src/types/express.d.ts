import type { Document, Types } from 'mongoose';
import type { ReviewDocument } from '../models/Review.js';

declare global {
  namespace Express {
    interface Request {
      user?: Document & {
        _id: Types.ObjectId;
        role: 'user' | 'manager' | 'admin';
        email: string;
        name: string;
        phone?: string | null;
        passwordChangedAt?: Date | null;
        active?: boolean;
      };
      filterObject?: Record<string, unknown>;
      reviewDoc?: ReviewDocument;
    }
  }
}

export {};
