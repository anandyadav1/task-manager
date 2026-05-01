import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { logActivity } from '../../utils/activityLogger.js';

export const createComment = async (taskId, userId, content) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, projectId: true, assignedToId: true },
  });

  if (!task) throw ApiError.notFound('Task not found');

  const comment = await prisma.comment.create({
    data: { content, taskId, userId },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  await logActivity({
    userId,
    action: 'ADDED_COMMENT',
    entity: 'task',
    entityId: taskId,
    meta: { commentId: comment.id },
  });

  // Notify the task assignee if different from commenter
  if (task.assignedToId && task.assignedToId !== userId) {
    await prisma.notification.create({
      data: {
        userId: task.assignedToId,
        message: `New comment on "${task.title}"`,
        type: 'COMMENT',
        link: `/projects/${task.projectId}?task=${taskId}`,
      },
    });
  }

  return comment;
};

export const getComments = async (taskId, page = 1, limit = 50) => {
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where: { taskId } }),
  ]);

  return {
    comments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const updateComment = async (commentId, userId, content) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });

  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.userId !== userId) throw ApiError.forbidden('You can only edit your own comments');

  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const deleteComment = async (commentId, userId) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });

  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.userId !== userId) throw ApiError.forbidden('You can only delete your own comments');

  await prisma.comment.delete({ where: { id: commentId } });
};
