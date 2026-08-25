import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { portfolioRepository, categoryRepository, profileRepository } from '../config/supabase';
import { storageService, StorageValidationError } from '../services/storageService';
import { AuthRequest } from '../middleware/auth';

export const createPortfolioImageSchema = z.object({
  storage_path: z.string().min(1, 'storage_path is required'),
  public_url: z.string().url('public_url must be a valid URL'),
  title: z.string().max(120).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  featured: z.boolean().optional().default(false),
  display_order: z.number().int().optional(),
  file_size: z.number().int().optional().nullable(),
  mime_type: z.string().optional().nullable(),
});

export const updatePortfolioImageSchema = z.object({
  title: z.string().max(120).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  featured: z.boolean().optional(),
  display_order: z.number().int().optional(),
});

export const reorderPortfolioImagesSchema = z.object({
  imageIds: z.array(z.string().uuid('Invalid image ID format')),
});

export const portfolioController = {
  async listMyImages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { category_id, featured } = req.query;
      const images = await portfolioRepository.listByPhotographer(
        photographer.id,
        category_id ? String(category_id) : undefined,
        featured === 'true'
      );

      res.status(200).json({
        success: true,
        data: images,
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: 'No image file provided in request.' });
        return;
      }

      // 1. Upload to Supabase Storage or resilient disk store
      const uploadResult = await storageService.uploadImage(
        req.file,
        'portfolio-images',
        photographer.id
      );

      // 2. Validate category if provided
      let categoryId: string | null = null;
      if (req.body.category_id && req.body.category_id !== 'null' && req.body.category_id !== '') {
        const category = await categoryRepository.findById(req.body.category_id);
        if (category && category.photographer_id === photographer.id) {
          categoryId = category.id;
        }
      }

      const totalExisting = await portfolioRepository.countByPhotographer(photographer.id);

      // 3. Save metadata record in PostgreSQL
      const newImage = await portfolioRepository.create({
        photographer_id: photographer.id,
        category_id: categoryId,
        storage_path: uploadResult.storage_path,
        public_url: uploadResult.public_url,
        title: req.body.title ? String(req.body.title).trim() : null,
        description: req.body.description ? String(req.body.description).trim() : null,
        featured: req.body.featured === 'true' || req.body.featured === true,
        display_order: totalExisting,
        file_size: uploadResult.file_size,
        mime_type: uploadResult.mime_type,
      });

      res.status(201).json({
        success: true,
        message: 'Portfolio image uploaded and cataloged successfully',
        data: newImage,
      });
    } catch (error: any) {
      if (error instanceof StorageValidationError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  },

  async updateImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { id } = req.params;
      const image = await portfolioRepository.findById(id);

      if (!image) {
        res.status(404).json({ success: false, message: 'Portfolio image not found' });
        return;
      }

      // IDOR Protection: Check image owner
      if (image.photographer_id !== photographer.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to modify this portfolio image.',
        });
        return;
      }

      // If category is being updated, verify it belongs to this photographer
      if (req.body.category_id !== undefined && req.body.category_id !== null) {
        const cat = await categoryRepository.findById(req.body.category_id);
        if (!cat || cat.photographer_id !== photographer.id) {
          res.status(400).json({
            success: false,
            message: 'Invalid category selection.',
          });
          return;
        }
      }

      const updates: any = {};
      if (req.body.title !== undefined) updates.title = req.body.title ? String(req.body.title).trim() : null;
      if (req.body.description !== undefined) updates.description = req.body.description ? String(req.body.description).trim() : null;
      if (req.body.category_id !== undefined) updates.category_id = req.body.category_id || null;
      if (req.body.featured !== undefined) updates.featured = Boolean(req.body.featured);
      if (req.body.display_order !== undefined) updates.display_order = Number(req.body.display_order);

      const updated = await portfolioRepository.update(id, updates);
      res.status(200).json({
        success: true,
        message: 'Portfolio image updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { id } = req.params;
      const image = await portfolioRepository.findById(id);

      if (!image) {
        res.status(404).json({ success: false, message: 'Portfolio image not found' });
        return;
      }

      // IDOR Protection: Check image owner
      if (image.photographer_id !== photographer.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to delete this portfolio image.',
        });
        return;
      }

      // Delete from storage
      await storageService.deleteImage('portfolio-images', image.storage_path);

      // Delete from PostgreSQL
      await portfolioRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'Portfolio image deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async reorderImages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { imageIds } = req.body;
      if (!Array.isArray(imageIds)) {
        res.status(400).json({ success: false, message: 'imageIds array is required' });
        return;
      }

      // Verify all images belong to this photographer
      for (const id of imageIds) {
        const img = await portfolioRepository.findById(id);
        if (!img || img.photographer_id !== photographer.id) {
          res.status(403).json({
            success: false,
            message: 'Forbidden: One or more images do not belong to your portfolio.',
          });
          return;
        }
      }

      await portfolioRepository.reorder(photographer.id, imageIds);
      const reordered = await portfolioRepository.listByPhotographer(photographer.id);

      res.status(200).json({
        success: true,
        message: 'Portfolio images reordered successfully',
        data: reordered,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPublicPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const photographer = await profileRepository.findBySlug(slug);
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer not found' });
        return;
      }

      const { category_id, featured } = req.query;
      const images = await portfolioRepository.listByPhotographer(
        photographer.id,
        category_id ? String(category_id) : undefined,
        featured === 'true'
      );

      res.status(200).json({
        success: true,
        data: images,
      });
    } catch (error) {
      next(error);
    }
  },
};
