import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer with memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB upper boundary (strict limit checked in storageService)
    files: 5,
  },
});

export const handleMulterError = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'Uploaded file exceeds the maximum permitted size limit.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
    return;
  }
  next(err);
};
