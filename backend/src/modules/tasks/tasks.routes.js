import { Router } from 'express';
import * as tasksController from './tasks.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { checkProjectMembership, checkProjectRole } from '../../middleware/role.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  reorderTaskSchema,
  listTasksQuerySchema,
} from './tasks.schema.js';

const router = Router({ mergeParams: true });

// All task routes require authentication + project membership
router.use(authenticateUser);

router.post(
  '/',
  checkProjectMembership,
  checkProjectRole('MEMBER'),
  validate(createTaskSchema),
  tasksController.createTask
);

router.get(
  '/',
  checkProjectMembership,
  validate(listTasksQuerySchema, 'query'),
  tasksController.getTasks
);

router.get(
  '/:taskId',
  checkProjectMembership,
  tasksController.getTaskById
);

router.patch(
  '/:taskId',
  checkProjectMembership,
  checkProjectRole('MEMBER'),
  validate(updateTaskSchema),
  tasksController.updateTask
);

router.delete(
  '/:taskId',
  checkProjectMembership,
  checkProjectRole('MANAGER'),
  tasksController.deleteTask
);

router.patch(
  '/:taskId/status',
  checkProjectMembership,
  checkProjectRole('MEMBER'),
  validate(updateTaskStatusSchema),
  tasksController.updateTaskStatus
);

router.patch(
  '/:taskId/assign',
  checkProjectMembership,
  checkProjectRole('MEMBER'),
  validate(assignTaskSchema),
  tasksController.assignTask
);

router.patch(
  '/:taskId/reorder',
  checkProjectMembership,
  checkProjectRole('MEMBER'),
  validate(reorderTaskSchema),
  tasksController.reorderTask
);

router.post(
  '/:taskId/subtasks',
  checkProjectMembership,
  checkProjectRole('MEMBER'),
  validate(createTaskSchema),
  tasksController.createSubtask
);

router.get(
  '/:taskId/subtasks',
  checkProjectMembership,
  tasksController.getSubtasks
);

export default router;
