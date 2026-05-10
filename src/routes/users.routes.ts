import { Router } from 'express';
import type { Env } from '../config/env.js';
import { buildUserController } from '../controllers/user.controller.js';
import { allowedTo, protect } from '../middleware/auth.middleware.js';
import { processUserProfileImage } from '../middleware/imageCloudinary.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { uploadSingleImage } from '../middleware/uploadMemory.js';
import {
  changePasswordSchema,
  createUserSchema,
  mongoIdParamSchema,
  updateLoggedUserPasswordSchema,
  updateLoggedUserSchema,
  updateUserSchema,
} from '../validation/user.schemas.js';

export function createUsersRouter(env: Env): Router {
  const r = Router();
  const c = buildUserController(env);
  const authProtect = protect(env);

  r.use(authProtect);

  r.get('/getMe', c.getLoggedUserData, c.getUser);
  r.put('/changeMyPassword', validateRequest(updateLoggedUserPasswordSchema), c.updateLoggedUserPassword);
  r.put('/updateMe', validateRequest(updateLoggedUserSchema), c.updateLoggedUserData);
  r.delete('/deleteMe', c.deleteLoggedUserData);

  r.use(allowedTo('admin', 'manager'));
  r.put('/changePassword/:id', validateRequest(changePasswordSchema), c.changeUserPassword);
  r.route('/').get(c.getUsers).post(uploadSingleImage('profileImg'), processUserProfileImage(env), validateRequest(createUserSchema), c.createUser);
  r
    .route('/:id')
    .get(validateRequest(mongoIdParamSchema, 'params'), c.getUser)
    .put(
      uploadSingleImage('profileImg'),
      processUserProfileImage(env),
      validateRequest(updateUserSchema),
      c.updateUser
    )
    .delete(validateRequest(mongoIdParamSchema, 'params'), c.deleteUser);

  return r;
}
