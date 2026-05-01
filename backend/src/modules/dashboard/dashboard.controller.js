import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import prisma from '../../config/db.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  // Get all project IDs where user is a member
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const myProjectIds = memberships.map((m) => m.projectId);

  // For ADMIN: see all tasks across their projects
  // For others: see tasks assigned to them + tasks in their projects for overview
  const isAdmin = userRole === 'ADMIN';

  // Build the "task scope" filter:
  // - Admin/Manager: all tasks in projects they belong to
  // - Member/Viewer: tasks assigned to them
  const taskScope = isAdmin
    ? { projectId: { in: myProjectIds } }
    : { OR: [{ assignedToId: userId }, { projectId: { in: myProjectIds } }] };

  // Personal task scope (always filtered to assigned tasks for personal stats)
  const myTaskScope = { assignedToId: userId };

  const [
    allTasksByStatus,
    myTasksByStatus,
    overdueTasks,
    completedToday,
    myCompletedToday,
    myProjects,
    recentActivity,
    weeklyCompletionData,
  ] = await Promise.all([
    // All tasks in scope grouped by status
    prisma.task.groupBy({
      by: ['status'],
      where: { ...taskScope, parentTaskId: null },
      _count: { id: true },
    }),

    // My assigned tasks grouped by status
    prisma.task.groupBy({
      by: ['status'],
      where: { ...myTaskScope, parentTaskId: null },
      _count: { id: true },
    }),

    // Overdue tasks (in scope)
    prisma.task.count({
      where: {
        ...taskScope,
        parentTaskId: null,
        dueDate: { lt: now },
        status: { notIn: ['DONE', 'CANCELLED'] },
      },
    }),

    // All tasks completed today (in scope)
    prisma.task.count({
      where: {
        ...taskScope,
        parentTaskId: null,
        status: 'DONE',
        updatedAt: { gte: startOfToday, lt: endOfToday },
      },
    }),

    // My tasks completed today
    prisma.task.count({
      where: {
        assignedToId: userId,
        status: 'DONE',
        updatedAt: { gte: startOfToday, lt: endOfToday },
      },
    }),

    // My projects with task progress
    prisma.project.findMany({
      where: {
        members: { some: { userId } },
        status: 'ACTIVE',
      },
      include: {
        _count: { select: { tasks: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          take: 5,
        },
      },
      take: 6,
      orderBy: { updatedAt: 'desc' },
    }),

    // Recent activity — for admin: all recent activity; for others: their own
    isAdmin
      ? prisma.activityLog.findMany({
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 15,
        })
      : prisma.activityLog.findMany({
          where: { userId },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),

    // Weekly completion data (last 8 weeks) — scope-aware
    getWeeklyCompletionData(isAdmin ? null : userId, isAdmin ? myProjectIds : null),
  ]);

  // Calculate stats
  const totalTasks = allTasksByStatus.reduce((acc, s) => acc + s._count.id, 0);
  const inProgress = allTasksByStatus.find((s) => s.status === 'IN_PROGRESS')?._count.id || 0;
  const myTotal = myTasksByStatus.reduce((acc, s) => acc + s._count.id, 0);
  const myInProgress = myTasksByStatus.find((s) => s.status === 'IN_PROGRESS')?._count.id || 0;

  // Get done count for each project
  const projectsWithProgress = await Promise.all(
    myProjects.map(async (p) => {
      const doneCount = await prisma.task.count({
        where: { projectId: p.id, status: 'DONE', parentTaskId: null },
      });
      const totalCount = await prisma.task.count({
        where: { projectId: p.id, parentTaskId: null },
      });
      const { _count, ...rest } = p;
      return {
        ...rest,
        totalTasks: totalCount,
        completedTasks: doneCount,
        progress: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
      };
    })
  );

  res.json(
    ApiResponse.success({
      stats: {
        totalTasks,
        inProgress,
        overdue: overdueTasks,
        completedToday,
        // personal breakdown
        myTotalAssigned: myTotal,
        myInProgress,
        myCompletedToday,
      },
      tasksByStatus: allTasksByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      projects: projectsWithProgress,
      recentActivity,
      weeklyCompletion: weeklyCompletionData,
    })
  );
});

/**
 * Get weekly task completion data for charts
 * If userId is null and projectIds is provided, count across all projects
 */
async function getWeeklyCompletionData(userId, projectIds) {
  const weeks = [];
  const now = new Date();

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const where = {
      status: 'DONE',
      parentTaskId: null,
      updatedAt: { gte: weekStart, lt: weekEnd },
    };

    if (userId) {
      where.assignedToId = userId;
    } else if (projectIds && projectIds.length > 0) {
      where.projectId = { in: projectIds };
    }

    const count = await prisma.task.count({ where });

    // Format label as short date range
    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    weeks.push({
      week: weekStart.toISOString().split('T')[0],
      label: startLabel,
      completed: count,
    });
  }

  return weeks;
}
