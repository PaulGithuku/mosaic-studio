import { Request, Response, NextFunction } from 'express';
import { verifySupabaseToken, profileRepository, ProfileRecord } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    user_metadata?: Record<string, any>;
  };
  profile?: ProfileRecord;
}

/**
 * Middleware that authenticates incoming requests via Supabase Bearer token
 * and resolves the authenticated photographer's profile from the database
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
    return;
  }

  try {
    const { user, error } = await verifySupabaseToken(token);
    if (error || !user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please sign in again.',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      user_metadata: (user as any).user_metadata || {},
    };

    // Resolve profile record or auto-initialize for authenticated user
    try {
      let profile = await profileRepository.findByUserId(user.id);
      if (!profile && user.email) {
        const userName = (user as any).user_metadata?.name || user.email.split('@')[0] || 'Photographer';
        profile = await profileRepository.ensureProfile({
          user_id: user.id,
          email: user.email,
          name: userName,
        });
      }
      if (profile) {
        req.profile = profile;
      }
    } catch (err) {
      console.warn('[Auth Middleware] Profile resolution warning:', err);
    }

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed. Please sign in again.',
    });
  }
}

/**
 * Middleware to ensure the authenticated user owns a valid photographer profile
 */
export function requireProfile(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (!req.profile) {
    res.status(403).json({
      success: false,
      message: 'Photographer profile not found or not yet initialized.',
    });
    return;
  }

  next();
}
