import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../../data/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = [
  // images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  // videos
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
];

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per file
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

export function uploadSingleFile() {
  return upload.single('file');
}

export function uploadTwoFiles() {
  return upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]);
}

export function handleUpload(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({
      code: 1,
      message: 'No file uploaded',
    });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    code: 0,
    message: 'success',
    data: {
      url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
    },
  });
}

export function handleUploadTwoFiles(req: Request, res: Response) {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const result: { cover?: { url: string; filename: string }, video?: { url: string; filename: string } } = {};

  if (files.cover && files.cover[0]) {
    result.cover = {
      url: `/uploads/${files.cover[0].filename}`,
      filename: files.cover[0].filename,
    };
  }

  if (files.video && files.video[0]) {
    result.video = {
      url: `/uploads/${files.video[0].filename}`,
      filename: files.video[0].filename,
    };
  }

  res.json({
    code: 0,
    message: 'success',
    data: result,
  });
}

export function serveUploads() {
  return express.static(uploadDir);
}
