import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailToken,
  verifyEmailToken,
} from '../../utils/jwt.js';
import { sendEmail } from '../../config/email.js';

const SALT_ROUNDS = 12;

/**
 * Register a new user
 */
export const register = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  // Generate email verification token
  const verifyToken = generateEmailToken({ userId: user.id, type: 'email-verify' });
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;

  await sendEmail({
    to: email,
    subject: 'Welcome to Team Task Manager — Verify Your Email',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for signing up. Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Verify Email</a>
      <p>This link expires in 1 hour.</p>
    `,
  });

  return user;
};

/**
 * Login user and return tokens
 */
export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

  // Store refresh token in database
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

  return {
    user: userWithoutSensitive,
    accessToken,
    refreshToken,
  };
};

/**
 * Logout user — clear refresh token
 */
export const logout = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.refreshToken !== refreshToken) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
  const newRefreshToken = generateRefreshToken({ userId: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, data) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Send password reset email
 */
export const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Don't reveal if user exists
  if (!user) return;

  const resetToken = generateEmailToken({ userId: user.id, type: 'password-reset' });
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: email,
    subject: 'Team Task Manager — Password Reset',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Reset Password</a>
      <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    `,
  });
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, newPassword) => {
  let decoded;
  try {
    decoded = verifyEmailToken(token);
  } catch {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  if (decoded.type !== 'password-reset') {
    throw ApiError.badRequest('Invalid token type');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: decoded.userId },
    data: {
      password: hashedPassword,
      refreshToken: null, // Invalidate all sessions
    },
  });
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token) => {
  let decoded;
  try {
    decoded = verifyEmailToken(token);
  } catch {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  if (decoded.type !== 'email-verify') {
    throw ApiError.badRequest('Invalid token type');
  }

  await prisma.user.update({
    where: { id: decoded.userId },
    data: { isVerified: true },
  });
};

/**
 * Change password (authenticated user)
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};
