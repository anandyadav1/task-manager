import ApiError from '../utils/ApiError.js';
import prisma from '../config/db.js';

/**
 * Check if the user has a required global role (e.g., ADMIN).
 * Must be used AFTER authenticateUser middleware.
 */
export const requireGlobalRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires one of: ${roles.join(', ')}`));
    }

    next();
  };
};

/**
 * Check if the user is a member of the specified project.
 * Reads projectId from req.params.id or req.params.projectId.
 * Sets req.projectMember with { role, projectId, userId }.
 * Global ADMINs bypass membership checks.
 */
export const checkProjectMembership = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;

    if (!projectId) {
      return next(ApiError.badRequest('Project ID is required'));
    }

    // Verify the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return next(ApiError.notFound('Project not found'));
    }

    req.project = project;

    // Global ADMINs bypass membership checks
    if (req.user.role === 'ADMIN') {
      req.projectMember = { role: 'OWNER', projectId, userId: req.user.id };
      return next();
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      return next(ApiError.forbidden('You are not a member of this project'));
    }

    req.projectMember = membership;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if the user has the minimum required project role.
 * Role hierarchy: OWNER > MANAGER > MEMBER > VIEWER
 * Must be used AFTER checkProjectMembership middleware.
 */
const ROLE_HIERARCHY = {
  VIEWER: 0,
  MEMBER: 1,
  MANAGER: 2,
  OWNER: 3,
};

export const checkProjectRole = (minRole) => {
  return (req, res, next) => {
    if (!req.projectMember) {
      return next(ApiError.forbidden('Project membership required'));
    }

    const userRoleLevel = ROLE_HIERARCHY[req.projectMember.role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

    if (userRoleLevel < requiredLevel) {
      return next(
        ApiError.forbidden(`Requires at least ${minRole} role in this project`)
      );
    }

    next();
  };
};
