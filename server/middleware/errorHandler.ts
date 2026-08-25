import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV !== 'production';

  // Do not log sensitive credentials
  console.error('[Server Error]', err.name || 'Error', err.message);

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = statusCode === 500 && !isDev ? 'An unexpected server error occurred' : err.message || 'Server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && err.stack ? { stack: err.stack } : {}),
  });
}
