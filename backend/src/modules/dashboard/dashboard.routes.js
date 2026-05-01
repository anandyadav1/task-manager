import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);
router.get('/', dashboardController.getDashboard);

export default router;
