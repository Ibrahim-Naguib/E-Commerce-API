import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import * as reviewController from '../controllers/review.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { mongoId } from '../validation/catalog.schemas.js';
import { createReviewSchema, updateReviewSchema } from '../validation/review.schemas.js';

const reviewIdParam = z.object({ id: mongoId });

export function createReviewRouter(env: Env): Router {
  const r = Router({ mergeParams: true });
  const authProtect = protect(env);

  r.get('/', reviewController.createFilterObject, reviewController.getReviews);
  r.get('/:id', validateRequest(reviewIdParam, 'params'), reviewController.getReview);

  r.use(authProtect);
  r.get('/user/myReviews', reviewController.getMyReviews);
  r.post(
    '/',
    allowedTo('user', 'admin'),
    validateRequest(createReviewSchema),
    reviewController.setProductAndUserIds,
    reviewController.checkExistingReview,
    reviewController.createReview
  );
  r.route('/:id')
    .put(reviewController.checkReviewOwnership, validateRequest(updateReviewSchema), reviewController.updateReview)
    .delete(reviewController.checkReviewOwnership, validateRequest(reviewIdParam, 'params'), reviewController.deleteReview);

  return r;
}
