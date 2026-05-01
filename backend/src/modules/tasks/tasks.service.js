import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { logActivity } from '../../utils/activityLogger.js';
import { sendEmail } from '../../config/email.js';

const TASK_INCLUDE = {
  assignedTo: {
    select: { id: true, name: true, email: true, avatar: true },
  },
  createdBy: {
    select: { id: true, name: true, email: true, avatar: true },
  },
  tags: true,
  _count: {
    select: { comments: true, attachments: true, subTasks: true },
  },
};

const TASK_DETAIL_INCLUDE = {
  ...TASK_INCLUDE,
  comments: {
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
  attachments: {
    orderBy: { createdAt: 'desc' },
  },
  subTasks: {
    include: {
      assignedTo: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { order: 'asc' },
  },
};

/**
 * Create a task in a project
 */
export const createTask = async (projectId, userId, data) => {
  // If assigning, verify the assignee is a project member
  if (data.assignedToId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: data.assignedToId } },
    });
    if (!isMember) {
      throw ApiError.badRequest('Assigned user is not a member of this project');
    }
  }

  // Get highest order in same status
  const maxOrder = await prisma.task.aggregate({
    where: { projectId, status: data.status || 'TODO' },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId,
      assignedToId: data.assignedToId,
      createdById: userId,
      parentTaskId: data.parentTaskId,
      order: (maxOrder._max.order ?? -1) + 1,
      ...(data.tagIds && {
        tags: { connect: data.tagIds.map((id) => ({ id })) },
      }),
    },
    include: TASK_INCLUDE,
  });

  await logActivity({
    userId,
    action: 'CREATED_TASK',
    entity: 'task',
    entityId: task.id,
    meta: { title: task.title, projectId },
  });

  // Notify assignee
  if (data.assignedToId && data.assignedToId !== userId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: data.assignedToId,
        message: `You've been assigned task "${task.title}" in "${project.name}"`,
        type: 'TASK_ASSIGNED',
        link: `/projects/${projectId}?task=${task.id}`,
      },
    });

    // Send email notification
    const assignee = await prisma.user.findUnique({
      where: { id: data.assignedToId },
      select: { email: true, name: true },
    });

    if (assignee) {
      await sendEmail({
        to: assignee.email,
        subject: `Task Assigned: "${task.title}" — Team Task Manager`,
        html: `
          <h2>New Task Assignment</h2>
          <p>Hi ${assignee.name},</p>
          <p>You've been assigned to <strong>${task.title}</strong> in project <strong>${project.name}</strong>.</p>
          <p>Priority: <strong>${task.priority}</strong></p>
          ${task.dueDate ? `<p>Due: <strong>${new Date(task.dueDate).toLocaleDateString()}</strong></p>` : ''}
          <a href="${process.env.CLIENT_URL}/projects/${projectId}?task=${task.id}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">View Task</a>
        `,
      });
    }
  }

  return task;
};

/**
 * Get tasks with filters and pagination
 */
export const getTasks = async (projectId, query) => {
  const { page, limit, status, priority, assigneeId, search, tag, dueBefore, dueAfter, sort, order } = query;

  const where = { projectId, parentTaskId: null }; // Only top-level tasks

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assignedToId = assigneeId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (tag) {
    where.tags = { some: { id: tag } };
  }
  if (dueBefore || dueAfter) {
    where.dueDate = {};
    if (dueBefore) where.dueDate.lte = new Date(dueBefore);
    if (dueAfter) where.dueDate.gte = new Date(dueAfter);
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: order },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get a single task with full details
 */
export const getTaskById = async (taskId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: TASK_DETAIL_INCLUDE,
  });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  return task;
};

/**
 * Update a task
 */
export const updateTask = async (taskId, userId, data) => {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) {
    throw ApiError.notFound('Task not found');
  }

  // If reassigning, verify the new assignee is a project member
  if (data.assignedToId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existing.projectId, userId: data.assignedToId } },
    });
    if (!isMember) {
      throw ApiError.badRequest('Assigned user is not a member of this project');
    }
  }

  const updateData = { ...data };
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }
  if (data.tagIds) {
    updateData.tags = { set: data.tagIds.map((id) => ({ id })) };
    delete updateData.tagIds;
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: TASK_INCLUDE,
  });

  const changes = {};
  if (data.status && data.status !== existing.status) changes.status = { from: existing.status, to: data.status };
  if (data.priority && data.priority !== existing.priority) changes.priority = { from: existing.priority, to: data.priority };
  if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) changes.assignee = { from: existing.assignedToId, to: data.assignedToId };

  await logActivity({
    userId,
    action: Object.keys(changes).length > 0 ? 'UPDATED_TASK' : 'UPDATED_TASK',
    entity: 'task',
    entityId: taskId,
    meta: { changes },
  });

  // Notify new assignee if changed
  if (data.assignedToId && data.assignedToId !== existing.assignedToId && data.assignedToId !== userId) {
    const project = await prisma.project.findUnique({
      where: { id: existing.projectId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: data.assignedToId,
        message: `You've been assigned task "${task.title}" in "${project.name}"`,
        type: 'TASK_ASSIGNED',
        link: `/projects/${existing.projectId}?task=${taskId}`,
      },
    });
  }

  return task;
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId, userId) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  await prisma.task.delete({ where: { id: taskId } });

  await logActivity({
    userId,
    action: 'DELETED_TASK',
    entity: 'task',
    entityId: taskId,
    meta: { title: task.title, projectId: task.projectId },
  });
};

/**
 * Quick status update (for Kanban drag-and-drop)
 */
export const updateTaskStatus = async (taskId, status, userId) => {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) throw ApiError.notFound('Task not found');

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: TASK_INCLUDE,
  });

  await logActivity({
    userId,
    action: 'UPDATED_STATUS',
    entity: 'task',
    entityId: taskId,
    meta: { from: existing.status, to: status, title: task.title },
  });

  // Notify assignee about status change
  if (existing.assignedToId && existing.assignedToId !== userId) {
    await prisma.notification.create({
      data: {
        userId: existing.assignedToId,
        message: `Task "${task.title}" status changed to ${status}`,
        type: 'TASK_ASSIGNED',
        link: `/projects/${existing.projectId}?task=${taskId}`,
      },
    });
  }

  return task;
};

/**
 * Assign/reassign a task
 */
export const assignTask = async (taskId, assignedToId, userId) => {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) throw ApiError.notFound('Task not found');

  // If assigning (not unassigning), verify project membership
  if (assignedToId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existing.projectId, userId: assignedToId } },
    });
    if (!isMember) {
      throw ApiError.badRequest('User is not a member of this project');
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { assignedToId },
    include: TASK_INCLUDE,
  });

  await logActivity({
    userId,
    action: 'ASSIGNED_MEMBER',
    entity: 'task',
    entityId: taskId,
    meta: { assignedToId, title: task.title },
  });

  return task;
};

/**
 * Reorder a task (for Kanban)
 */
export const reorderTask = async (taskId, status, order) => {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status, order },
    include: TASK_INCLUDE,
  });

  return task;
};

/**
 * Create a subtask
 */
export const createSubtask = async (parentTaskId, userId, data) => {
  const parent = await prisma.task.findUnique({ where: { id: parentTaskId } });
  if (!parent) throw ApiError.notFound('Parent task not found');

  const maxOrder = await prisma.task.aggregate({
    where: { parentTaskId },
    _max: { order: true },
  });

  const subtask = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status || 'TODO',
      priority: data.priority || parent.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId: parent.projectId,
      assignedToId: data.assignedToId,
      createdById: userId,
      parentTaskId,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    include: TASK_INCLUDE,
  });

  await logActivity({
    userId,
    action: 'CREATED_SUBTASK',
    entity: 'task',
    entityId: subtask.id,
    meta: { parentTaskId, title: subtask.title },
  });

  return subtask;
};

/**
 * Get subtasks of a task
 */
export const getSubtasks = async (parentTaskId) => {
  const subtasks = await prisma.task.findMany({
    where: { parentTaskId },
    include: TASK_INCLUDE,
    orderBy: { order: 'asc' },
  });

  return subtasks;
};
