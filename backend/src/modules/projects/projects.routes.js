import { Router } from 'express';
import * as projectsController from './projects.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import {
  checkProjectMembership,
  checkProjectRole,
} from '../../middleware/role.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  listProjectsQuerySchema,
} from './projects.schema.js';

const router = Router();

// All project routes require authentication
router.use(authenticateUser);

// Project CRUD
router.post('/', validate(createProjectSchema), projectsController.createProject);
router.get('/', validate(listProjectsQuerySchema, 'query'), projectsController.getProjects);
router.get('/:id', checkProjectMembership, projectsController.getProjectById);
router.patch(
  '/:id',
  checkProjectMembership,
  checkProjectRole('MANAGER'),
  validate(updateProjectSchema),
  projectsController.updateProject
);
router.delete(
  '/:id',
  checkProjectMembership,
  checkProjectRole('OWNER'),
  projectsController.deleteProject
);
router.get('/:id/stats', checkProjectMembership, projectsController.getProjectStats);
router.get('/:id/activity', checkProjectMembership, projectsController.getProjectActivity);

// Member management
router.post(
  '/:id/members',
  checkProjectMembership,
  checkProjectRole('MANAGER'),
  validate(inviteMemberSchema),
  projectsController.inviteMember
);
router.get('/:id/members', checkProjectMembership, projectsController.getMembers);
router.patch(
  '/:id/members/:userId/role',
  checkProjectMembership,
  checkProjectRole('OWNER'),
  validate(updateMemberRoleSchema),
  projectsController.updateMemberRole
);
router.delete(
  '/:id/members/:userId',
  checkProjectMembership,
  checkProjectRole('MANAGER'),
  projectsController.removeMember
);

export default router;
