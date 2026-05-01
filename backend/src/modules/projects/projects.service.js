import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { logActivity } from '../../utils/activityLogger.js';
import { sendEmail } from '../../config/email.js';

/**
 * Create a new project and set the creator as OWNER
 */
export const createProject = async (userId, data) => {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      deadline: data.deadline ? new Date(data.deadline) : null,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
  });

  await logActivity({
    userId,
    action: 'CREATED_PROJECT',
    entity: 'project',
    entityId: project.id,
    meta: { name: project.name },
  });

  return project;
};

/**
 * Get all projects for a user (with pagination)
 */
export const getProjects = async (userId, userRole, query) => {
  const { page, limit, search, status, sort, order } = query;

  const where = {};

  // Non-admin users only see projects they're members of
  if (userRole !== 'ADMIN') {
    where.members = {
      some: { userId },
    };
  }

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  if (status) {
    where.status = status;
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: order },
    }),
    prisma.project.count({ where }),
  ]);

  // Add task stats to each project
  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const taskStats = await prisma.task.groupBy({
        by: ['status'],
        where: { projectId: project.id },
        _count: { id: true },
      });

      const stats = {
        total: project._count.tasks,
        todo: 0,
        inProgress: 0,
        inReview: 0,
        done: 0,
        cancelled: 0,
      };

      taskStats.forEach((s) => {
        const key =
          s.status === 'TODO'
            ? 'todo'
            : s.status === 'IN_PROGRESS'
            ? 'inProgress'
            : s.status === 'IN_REVIEW'
            ? 'inReview'
            : s.status === 'DONE'
            ? 'done'
            : 'cancelled';
        stats[key] = s._count.id;
      });

      const { _count, ...rest } = project;
      return { ...rest, taskStats: stats };
    })
  );

  return {
    projects: projectsWithStats,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get a single project by ID with full details
 */
export const getProjectById = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      tags: true,
      _count: {
        select: { tasks: true },
      },
    },
  });

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  // Task statistics
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId },
    _count: { id: true },
  });

  const overdueCount = await prisma.task.count({
    where: {
      projectId,
      dueDate: { lt: new Date() },
      status: { notIn: ['DONE', 'CANCELLED'] },
    },
  });

  const stats = {
    total: project._count.tasks,
    todo: 0,
    inProgress: 0,
    inReview: 0,
    done: 0,
    cancelled: 0,
    overdue: overdueCount,
  };

  taskStats.forEach((s) => {
    const key =
      s.status === 'TODO'
        ? 'todo'
        : s.status === 'IN_PROGRESS'
        ? 'inProgress'
        : s.status === 'IN_REVIEW'
        ? 'inReview'
        : s.status === 'DONE'
        ? 'done'
        : 'cancelled';
    stats[key] = s._count.id;
  });

  const { _count, ...rest } = project;
  return { ...rest, taskStats: stats };
};

/**
 * Update a project
 */
export const updateProject = async (projectId, userId, data) => {
  const updateData = { ...data };
  if (data.deadline) {
    updateData.deadline = new Date(data.deadline);
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
  });

  await logActivity({
    userId,
    action: 'UPDATED_PROJECT',
    entity: 'project',
    entityId: project.id,
    meta: { changes: data },
  });

  return project;
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId, userId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  await prisma.project.delete({ where: { id: projectId } });

  await logActivity({
    userId,
    action: 'DELETED_PROJECT',
    entity: 'project',
    entityId: projectId,
    meta: { name: project.name },
  });
};

/**
 * Get project stats
 */
export const getProjectStats = async (projectId) => {
  const [tasksByStatus, tasksByPriority, memberContributions, overdueTasks] =
    await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['assignedToId'],
        where: { projectId, assignedToId: { not: null } },
        _count: { id: true },
      }),
      prisma.task.count({
        where: {
          projectId,
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),
    ]);

  // Get member names for contributions
  const memberIds = memberContributions
    .map((c) => c.assignedToId)
    .filter(Boolean);
  const members = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, avatar: true },
  });

  const contributions = memberContributions.map((c) => {
    const member = members.find((m) => m.id === c.assignedToId);
    return {
      user: member,
      taskCount: c._count.id,
    };
  });

  return {
    tasksByStatus,
    tasksByPriority,
    memberContributions: contributions,
    overdueCount: overdueTasks,
  };
};

/**
 * Get project activity
 */
export const getProjectActivity = async (projectId, page = 1, limit = 20) => {
  // Get all task IDs in the project
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { id: true },
  });
  const taskIds = tasks.map((t) => t.id);

  const where = {
    OR: [
      { entity: 'project', entityId: projectId },
      { entity: 'task', entityId: { in: taskIds } },
    ],
  };

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    activities,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Member Management ──────────────────────────────────

/**
 * Invite a member by email
 */
export const inviteMember = async (projectId, email, role, inviterId) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw ApiError.notFound('User with this email not found. They must register first.');
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });

  if (existingMember) {
    throw ApiError.conflict('User is already a member of this project');
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: user.id,
      role,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  // Get project name for notification
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      message: `You've been invited to project "${project.name}" as ${role}`,
      type: 'PROJECT_INVITE',
      link: `/projects/${projectId}`,
    },
  });

  // Send email
  await sendEmail({
    to: email,
    subject: `You've been invited to "${project.name}" — Team Task Manager`,
    html: `
      <h2>Project Invitation</h2>
      <p>You've been invited to join <strong>${project.name}</strong> as a <strong>${role}</strong>.</p>
      <a href="${process.env.CLIENT_URL}/projects/${projectId}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">View Project</a>
    `,
  });

  await logActivity({
    userId: inviterId,
    action: 'INVITED_MEMBER',
    entity: 'project',
    entityId: projectId,
    meta: { memberEmail: email, role },
  });

  return member;
};

/**
 * List project members
 */
export const getMembers = async (projectId) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  // Get task count for each member
  const membersWithStats = await Promise.all(
    members.map(async (m) => {
      const taskCount = await prisma.task.count({
        where: { projectId, assignedToId: m.userId },
      });
      return { ...m, taskCount };
    })
  );

  return membersWithStats;
};

/**
 * Update member role
 */
export const updateMemberRole = async (projectId, userId, newRole, updaterId) => {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!member) {
    throw ApiError.notFound('Member not found in this project');
  }

  if (member.role === 'OWNER') {
    throw ApiError.forbidden('Cannot change the role of the project owner');
  }

  const updated = await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role: newRole },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  await logActivity({
    userId: updaterId,
    action: 'CHANGED_MEMBER_ROLE',
    entity: 'project',
    entityId: projectId,
    meta: { memberId: userId, oldRole: member.role, newRole },
  });

  return updated;
};

/**
 * Remove a member from a project
 */
export const removeMember = async (projectId, userId, removerId) => {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!member) {
    throw ApiError.notFound('Member not found in this project');
  }

  if (member.role === 'OWNER') {
    throw ApiError.forbidden('Cannot remove the project owner');
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  await logActivity({
    userId: removerId,
    action: 'REMOVED_MEMBER',
    entity: 'project',
    entityId: projectId,
    meta: { removedUserId: userId },
  });
};
