import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import prisma from '../../config/db.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const where = { userId: req.user.id };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
  ]);

  res.json({
    ...ApiResponse.paginated(notifications, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }),
    unreadCount,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
  });

  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });

  res.json(ApiResponse.success(null, 'Notification marked as read'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  res.json(ApiResponse.success(null, 'All notifications marked as read'));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
  });

  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  await prisma.notification.delete({ where: { id: req.params.id } });

  res.json(ApiResponse.success(null, 'Notification deleted'));
});
