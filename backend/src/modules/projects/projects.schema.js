import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be at most 100 characters')
    .trim(),
  description: z.string().max(2000).optional(),
  deadline: z
    .string()
    .datetime({ offset: true })
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      'Deadline must be a future date'
    ),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be at most 100 characters')
    .trim()
    .optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
  deadline: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['MANAGER', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['MANAGER', 'MEMBER', 'VIEWER'], {
    errorMap: () => ({ message: 'Role must be MANAGER, MEMBER, or VIEWER' }),
  }),
});

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
  sort: z.enum(['name', 'createdAt', 'updatedAt', 'deadline']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
