import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { requireGlobalRole } from '../../middleware/role.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { updateUserRoleSchema, listUsersQuerySchema } from './users.schema.js';

const router = Router();

// All routes require authentication + ADMIN role
router.use(authenticateUser, requireGlobalRole('ADMIN'));

router.get('/', validate(listUsersQuerySchema, 'query'), usersController.listUsers);
router.get('/:id', usersController.getUserById);
router.patch('/:id/role', validate(updateUserRoleSchema), usersController.updateUserRole);
router.delete('/:id', usersController.deleteUser);

export default router;
