import { Router } from 'express';
import type { Env } from '../config/env.js';
import { buildAuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
  verifyResetCodeSchema,
} from '../validation/auth.schemas.js';

export function createAuthRouter(env: Env): Router {
  const r = Router();
  const c = buildAuthController(env);
  r.post('/signup', validateRequest(signupSchema), c.signup);
  r.post('/signin', validateRequest(signinSchema), c.signin);
  r.post('/signout', c.signout);
  r.post('/refresh', c.refresh);
  r.post('/forgotPassword', validateRequest(forgotPasswordSchema), c.forgotPassword);
  r.post('/verifyResetCode', validateRequest(verifyResetCodeSchema), c.verifyPassResetCode);
  r.put('/resetPassword', validateRequest(resetPasswordSchema), c.resetPassword);
  return r;
}
