import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService, AuthError } from '../services/authService';
import { AuthRequest } from '../middleware/auth';

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(128, 'Password cannot exceed 128 characters'),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined && data.confirmPassword !== data.password) {
        return false;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register({ name, email, password });

      res.status(201).json({
        success: true,
        message: 'Photographer registered successfully',
        data: result,
      });
    } catch (error: any) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  },

  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const result = await authService.getCurrentUser(req.user.id, req.user.email);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  },
};
