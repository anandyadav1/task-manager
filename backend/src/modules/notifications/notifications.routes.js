import { Router } from 'express';
import * as notificationsController from './notifications.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/', notificationsController.getNotifications);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead);
router.delete('/:id', notificationsController.deleteNotification);

export default router;
