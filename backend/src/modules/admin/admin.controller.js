import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import prisma from '../../config/db.js';

export const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProjects, totalTasks, tasksByStatus, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.task.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  res.json(
    ApiResponse.success({
      totalUsers,
      totalProjects,
      totalTasks,
      tasksByStatus: tasksByStatus.map((s) => ({ status: s.status, count: s._count.id })),
      recentUsers,
    })
  );
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { assignedTasks: true, projectMembers: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json(ApiResponse.paginated(users, { page, limit, total, totalPages: Math.ceil(total / limit) }));
});

export const getAllActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count(),
  ]);

  res.json(ApiResponse.paginated(activities, { page, limit, total, totalPages: Math.ceil(total / limit) }));
});
