import cron from 'node-cron';
import prisma from '../config/db.js';
import { sendToUser } from '../socket/socket.js';

/**
 * Overdue task detection job
 * Runs every hour to find tasks past their due date that aren't done/cancelled.
 * Creates notifications for assignees.
 */
const startOverdueTaskJob = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running overdue task detection job...');

    try {
      const now = new Date();

      // Find overdue tasks that haven't already been notified recently
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { notIn: ['DONE', 'CANCELLED'] },
          assignedToId: { not: null },
        },
        include: {
          project: { select: { name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      });

      let notificationsCreated = 0;

      for (const task of overdueTasks) {
        // Check if we've already sent an overdue notification in the last 24h
        const recentNotification = await prisma.notification.findFirst({
          where: {
            userId: task.assignedToId,
            type: 'TASK_DUE',
            link: { contains: task.id },
            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          },
        });

        if (!recentNotification) {
          await prisma.notification.create({
            data: {
              userId: task.assignedToId,
              message: `Task "${task.title}" in "${task.project.name}" is overdue!`,
              type: 'TASK_DUE',
              link: `/projects/${task.projectId}?task=${task.id}`,
            },
          });

          // Real-time notification
          sendToUser(task.assignedToId, 'notification', {
            message: `Task "${task.title}" is overdue!`,
            type: 'TASK_DUE',
          });

          notificationsCreated++;
        }
      }

      console.log(
        `⏰ Overdue job complete: ${overdueTasks.length} overdue tasks found, ${notificationsCreated} notifications sent`
      );
    } catch (error) {
      console.error('⏰ Overdue task job error:', error.message);
    }
  });

  console.log('⏰ Overdue task detection job scheduled (every hour)');
};

export default startOverdueTaskJob;
