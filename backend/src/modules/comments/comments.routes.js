import { Router } from 'express';
import * as commentsController from './comments.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { createCommentSchema, updateCommentSchema } from './comments.schema.js';

const router = Router({ mergeParams: true });

router.use(authenticateUser);

router.post('/', validate(createCommentSchema), commentsController.createComment);
router.get('/', commentsController.getComments);
router.patch('/:commentId', validate(updateCommentSchema), commentsController.updateComment);
router.delete('/:commentId', commentsController.deleteComment);

export default router;
