import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as commentsService from './comments.service.js';

export const createComment = asyncHandler(async (req, res) => {
  const comment = await commentsService.createComment(req.params.taskId, req.user.id, req.body.content);
  res.status(201).json(ApiResponse.created(comment, 'Comment added'));
});

export const getComments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const { comments, pagination } = await commentsService.getComments(req.params.taskId, page, limit);
  res.json(ApiResponse.paginated(comments, pagination));
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentsService.updateComment(req.params.commentId, req.user.id, req.body.content);
  res.json(ApiResponse.success(comment, 'Comment updated'));
});

export const deleteComment = asyncHandler(async (req, res) => {
  await commentsService.deleteComment(req.params.commentId, req.user.id);
  res.json(ApiResponse.success(null, 'Comment deleted'));
});
