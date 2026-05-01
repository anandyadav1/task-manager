import prisma from '../config/db.js';

/**
 * Log an activity to the ActivityLog table.
 *
 * @param {Object} params
 * @param {string} params.userId - ID of the user performing the action
 * @param {string} params.action - Action type (e.g., CREATED_TASK, UPDATED_STATUS)
 * @param {string} params.entity - Entity type (e.g., task, project, comment)
 * @param {string} params.entityId - ID of the affected entity
 * @param {Object} [params.meta] - Additional metadata (e.g., old/new values)
 */
export const logActivity = async ({ userId, action, entity, entityId, meta = null }) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        meta,
      },
    });
  } catch (error) {
    // Activity logging should never crash the main flow
    console.error('Activity log error:', error.message);
  }
};

export default logActivity;
