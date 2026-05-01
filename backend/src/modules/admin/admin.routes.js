import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { requireGlobalRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticateUser, requireGlobalRole('ADMIN'));

router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAllUsers);
router.get('/activity', adminController.getAllActivity);

export default router;
