import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * List all users with pagination and search
 */
export const listUsers = async ({ page, limit, search, role, sort, order }) => {
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: order },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single user by ID
 */
export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...USER_SELECT,
      _count: {
        select: {
          assignedTasks: true,
          createdTasks: true,
          projectMembers: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};

/**
 * Update a user's global role
 */
export const updateUserRole = async (userId, role) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: USER_SELECT,
  });

  return updated;
};

/**
 * Delete a user
 */
export const deleteUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  await prisma.user.delete({ where: { id: userId } });
};
