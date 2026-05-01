import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as usersService from './users.service.js';

/**
 * GET /api/users
 */
export const listUsers = asyncHandler(async (req, res) => {
  const { users, pagination } = await usersService.listUsers(req.query);
  res.json(ApiResponse.paginated(users, pagination));
});

/**
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  res.json(ApiResponse.success(user));
});

/**
 * PATCH /api/users/:id/role
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await usersService.updateUserRole(req.params.id, req.body.role);
  res.json(ApiResponse.success(user, 'User role updated'));
});

/**
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await usersService.deleteUser(req.params.id);
  res.json(ApiResponse.success(null, 'User deleted'));
});
