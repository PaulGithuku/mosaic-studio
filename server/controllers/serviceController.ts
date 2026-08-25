import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { serviceRepository, profileRepository } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'] as const;

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Service name cannot exceed 100 characters'),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().min(0, 'Price cannot be negative'),
  currency: z.enum(ALLOWED_CURRENCIES).optional().default('USD'),
  duration_minutes: z.number().int('Duration must be an integer').min(5, 'Duration must be at least 5 minutes').max(1440, 'Duration cannot exceed 24 hours'),
  category: z.string().max(50).optional().nullable(),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  currency: z.enum(ALLOWED_CURRENCIES).optional(),
  duration_minutes: z.number().int().min(5, 'Duration must be at least 5 minutes').max(1440).optional(),
  category: z.string().max(50).optional().nullable(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const serviceController = {
  async listMyServices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const services = await serviceRepository.listByPhotographer(photographer.id);
      res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error) {
      next(error);
    }
  },

  async createService(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const currentCount = await serviceRepository.countByPhotographer(photographer.id);

      const newService = await serviceRepository.create({
        photographer_id: photographer.id,
        name: req.body.name.trim(),
        description: req.body.description ? String(req.body.description).trim() : null,
        price: Number(req.body.price),
        currency: req.body.currency || 'USD',
        duration_minutes: Number(req.body.duration_minutes),
        category: req.body.category ? String(req.body.category).trim() : null,
        featured: req.body.featured ?? false,
        active: req.body.active ?? true,
        display_order: currentCount,
      });

      res.status(201).json({
        success: true,
        message: 'Photography service created successfully',
        data: newService,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateService(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { id } = req.params;
      const service = await serviceRepository.findById(id);

      if (!service) {
        res.status(404).json({ success: false, message: 'Service not found' });
        return;
      }

      // IDOR Protection: Check owner
      if (service.photographer_id !== photographer.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to modify this service.',
        });
        return;
      }

      const updates: any = {};
      if (req.body.name !== undefined) updates.name = req.body.name.trim();
      if (req.body.description !== undefined) updates.description = req.body.description ? String(req.body.description).trim() : null;
      if (req.body.price !== undefined) updates.price = Number(req.body.price);
      if (req.body.currency !== undefined) updates.currency = req.body.currency;
      if (req.body.duration_minutes !== undefined) updates.duration_minutes = Number(req.body.duration_minutes);
      if (req.body.category !== undefined) updates.category = req.body.category ? String(req.body.category).trim() : null;
      if (req.body.featured !== undefined) updates.featured = Boolean(req.body.featured);
      if (req.body.active !== undefined) updates.active = Boolean(req.body.active);

      const updated = await serviceRepository.update(id, updates);
      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteService(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { id } = req.params;
      const service = await serviceRepository.findById(id);

      if (!service) {
        res.status(404).json({ success: false, message: 'Service not found' });
        return;
      }

      // IDOR Protection: Check owner
      if (service.photographer_id !== photographer.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to delete this service.',
        });
        return;
      }

      await serviceRepository.delete(id);
      res.status(200).json({
        success: true,
        message: 'Service removed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async getPublicServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const photographer = await profileRepository.findBySlug(slug);
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer not found' });
        return;
      }

      const services = await serviceRepository.listByPhotographer(photographer.id, true);
      res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error) {
      next(error);
    }
  },
};
