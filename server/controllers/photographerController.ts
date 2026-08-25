import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService, AuthError } from '../services/authService';
import {
  profileRepository,
  categoryRepository,
  portfolioRepository,
  serviceRepository,
  availabilityRepository,
} from '../config/supabase';
import { storageService, StorageValidationError } from '../services/storageService';
import { AuthRequest } from '../middleware/auth';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(80).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  bio: z.string().max(2000).optional().nullable(),
  profile_image_path: z.string().optional().nullable(),
  location: z.string().max(150).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url('Invalid website URL').or(z.literal('')).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  facebook: z.string().max(100).optional().nullable(),
  tiktok: z.string().max(100).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  specialties: z.array(z.string()).max(10).optional(),
  years_experience: z.number().int().min(0).max(100).optional(),
});

export const photographerController = {
  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      if (!slug) {
        res.status(400).json({
          success: false,
          message: 'Photographer slug is required',
        });
        return;
      }

      const profile = await authService.getPublicProfile(slug);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Photographer studio not found',
        });
        return;
      }

      // Return public profile (sanitizing any internal sensitive fields)
      res.status(200).json({
        success: true,
        data: {
          id: profile.id,
          name: profile.name,
          slug: profile.slug,
          bio: profile.bio || '',
          profile_image_path: profile.profile_image_path || '',
          location: profile.location || '',
          phone: profile.phone || '',
          email: profile.email,
          website: profile.website || '',
          instagram: profile.instagram || '',
          facebook: profile.facebook || '',
          tiktok: profile.tiktok || '',
          whatsapp: profile.whatsapp || '',
          specialties: profile.specialties || [],
          years_experience: profile.years_experience || 0,
          created_at: profile.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getPublicStudioFull(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      if (!slug) {
        res.status(400).json({
          success: false,
          message: 'Photographer slug is required',
        });
        return;
      }

      const profile = await profileRepository.findBySlug(slug);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Photographer studio not found',
        });
        return;
      }

      const [categories, portfolio, services, availability] = await Promise.all([
        categoryRepository.listByPhotographer(profile.id, true),
        portfolioRepository.listByPhotographer(profile.id),
        serviceRepository.listByPhotographer(profile.id, true),
        availabilityRepository.getSchedule(profile.id),
      ]);

      res.status(200).json({
        success: true,
        data: {
          profile: {
            id: profile.id,
            name: profile.name,
            slug: profile.slug,
            bio: profile.bio || '',
            profile_image_path: profile.profile_image_path || '',
            location: profile.location || '',
            phone: profile.phone || '',
            email: profile.email,
            website: profile.website || '',
            instagram: profile.instagram || '',
            facebook: profile.facebook || '',
            tiktok: profile.tiktok || '',
            whatsapp: profile.whatsapp || '',
            specialties: profile.specialties || [],
            years_experience: profile.years_experience || 0,
            created_at: profile.created_at,
          },
          categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            display_order: c.display_order,
          })),
          portfolio: portfolio.map((img) => ({
            id: img.id,
            category_id: img.category_id,
            category_name: img.category_name,
            public_url: img.public_url,
            title: img.title || '',
            description: img.description || '',
            featured: img.featured,
            display_order: img.display_order,
            file_size: img.file_size,
            mime_type: img.mime_type,
            created_at: img.created_at,
          })),
          services: services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description || '',
            price: s.price,
            currency: s.currency,
            duration_minutes: s.duration_minutes,
            category: s.category || '',
            featured: s.featured,
            display_order: s.display_order,
          })),
          availability: availability
            .filter((a) => a.enabled)
            .map((a) => ({
              day_of_week: a.day_of_week,
              start_time: a.start_time,
              end_time: a.end_time,
              enabled: a.enabled,
            })),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const updated = await authService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Photographer profile updated successfully',
        data: updated,
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

  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: 'No image file provided for profile picture.' });
        return;
      }

      // Upload to storage
      const result = await storageService.uploadImage(req.file, 'profile-images', photographer.id);

      // Update profile record with new image path
      const updated = await profileRepository.update(photographer.user_id, {
        profile_image_path: result.public_url,
      });

      res.status(200).json({
        success: true,
        message: 'Profile image updated successfully',
        data: {
          profile_image_path: result.public_url,
          profile: updated,
        },
      });
    } catch (error: any) {
      if (error instanceof StorageValidationError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  },

  async removeAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const updated = await profileRepository.update(photographer.user_id, {
        profile_image_path: null,
      });

      res.status(200).json({
        success: true,
        message: 'Profile image removed',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
};
