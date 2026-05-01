import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.schema.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticateUser, authController.logout);
router.get('/me', authenticateUser, authController.getMe);
router.patch('/me', authenticateUser, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authenticateUser, validate(changePasswordSchema), authController.changePassword);

export default router;
