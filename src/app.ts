import { readFileSync } from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { API_PREFIX } from './constants.js';
import type { Env } from './config/env.js';
import { buildPaymentController } from './controllers/payment.controller.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { configureCloudinary } from './services/cloudinary.js';
import { ApiError } from './utils/ApiError.js';
import { createAdminRouter } from './routes/admin.routes.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createBrandsRouter } from './routes/brands.routes.js';
import { createCartRouter } from './routes/cart.routes.js';
import { createCategoriesRouter } from './routes/categories.routes.js';
import { createCouponsRouter } from './routes/coupons.routes.js';
import { createInventoryRouter } from './routes/inventory.routes.js';
import { createOrdersRouter } from './routes/orders.routes.js';
import { createPaymentsRouter } from './routes/payments.routes.js';
import { createProductsRouter } from './routes/products.routes.js';
import { createReviewRouter } from './routes/reviews.routes.js';
import { createStandaloneSubcategoriesRouter } from './routes/subcategories.routes.js';
import { createUsersRouter } from './routes/users.routes.js';
import { createWishlistRouter } from './routes/wishlist.routes.js';

export function createApp(env: Env): Express {
  configureCloudinary(env);
  const app = express();
  const payments = buildPaymentController(env);

  app.post(
    `${API_PREFIX}/payments/webhook`,
    express.raw({ type: 'application/json' }),
    payments.handleStripeWebhook
  );

  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  if (env.NODE_ENV !== 'test') {
    app.use(generalLimiter);
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const swaggerDocument = JSON.parse(readFileSync(path.join(process.cwd(), 'docs', 'openapi.json'), 'utf-8')) as object;
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use(`${API_PREFIX}/auth`, createAuthRouter(env));
  app.use(`${API_PREFIX}/users`, createUsersRouter(env));
  app.use(`${API_PREFIX}/categories`, createCategoriesRouter(env));
  app.use(`${API_PREFIX}/subcategories`, createStandaloneSubcategoriesRouter(env));
  app.use(`${API_PREFIX}/brands`, createBrandsRouter(env));
  app.use(`${API_PREFIX}/products`, createProductsRouter(env));
  app.use(`${API_PREFIX}/reviews`, createReviewRouter(env));
  app.use(`${API_PREFIX}/cart`, createCartRouter(env));
  app.use(`${API_PREFIX}/coupons`, createCouponsRouter(env));
  app.use(`${API_PREFIX}/orders`, createOrdersRouter(env));
  app.use(`${API_PREFIX}/payments`, createPaymentsRouter(env));
  app.use(`${API_PREFIX}/inventory`, createInventoryRouter(env));
  app.use(`${API_PREFIX}/wishlist`, createWishlistRouter(env));
  app.use(`${API_PREFIX}/admin`, createAdminRouter(env));

  app.use((req, _res, next) => {
    next(new ApiError(`Can't find ${req.originalUrl} on this server`, 404));
  });

  app.use(errorMiddleware);

  return app;
}
