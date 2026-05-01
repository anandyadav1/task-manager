import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as authService from './auth.service.js';

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json(ApiResponse.created(user, 'Registration successful. Please verify your email.'));
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  res.json(ApiResponse.success({ user, accessToken }, 'Login successful'));
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  res.json(ApiResponse.success(null, 'Logged out successfully'));
});

/**
 * POST /api/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const tokens = await authService.refreshAccessToken(token);

  // Set new refresh token cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json(ApiResponse.success({ accessToken: tokens.accessToken }, 'Token refreshed'));
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json(ApiResponse.success(user));
});

/**
 * PATCH /api/auth/me
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json(ApiResponse.success(user, 'Profile updated'));
});

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Always return success to prevent email enumeration
  res.json(ApiResponse.success(null, 'If the email exists, a reset link has been sent.'));
});

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json(ApiResponse.success(null, 'Password reset successful'));
});

/**
 * GET /api/auth/verify-email/:token
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  res.json(ApiResponse.success(null, 'Email verified successfully'));
});

/**
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.json(ApiResponse.success(null, 'Password changed successfully'));
});
