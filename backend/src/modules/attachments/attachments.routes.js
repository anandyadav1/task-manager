import multer from 'multer';
import { Router } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { unlinkSync } from 'fs';
import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import prisma from '../../config/db.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = join(__dirname, '..', '..', '..', 'uploads');

// Ensure uploads directory exists
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/zip',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'File type not allowed'), false);
    }
  },
});

const router = Router({ mergeParams: true });

router.use(authenticateUser);

// Upload attachment
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) throw ApiError.notFound('Task not found');

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        taskId: req.params.taskId,
      },
    });

    res.status(201).json(ApiResponse.created(attachment, 'Attachment uploaded'));
  })
);

// Delete attachment
router.delete(
  '/:attachmentId',
  asyncHandler(async (req, res) => {
    const attachment = await prisma.attachment.findUnique({
      where: { id: req.params.attachmentId },
    });

    if (!attachment) throw ApiError.notFound('Attachment not found');

    // Delete file from disk
    try {
      const filePath = join(uploadDir, attachment.url.replace('/uploads/', ''));
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err.message);
    }

    await prisma.attachment.delete({ where: { id: req.params.attachmentId } });

    res.json(ApiResponse.success(null, 'Attachment deleted'));
  })
);

export default router;
