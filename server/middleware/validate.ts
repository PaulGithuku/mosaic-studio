import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as any).issues || (error as any).errors || [];
        const errorMessages = issues.map((err: any) => ({
          field: Array.isArray(err.path) ? err.path.join('.') : '',
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: errorMessages[0]?.message || 'Validation error',
          errors: errorMessages,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
      });
    }
  };
}
