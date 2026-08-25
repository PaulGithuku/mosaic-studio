import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { categoryRepository, profileRepository } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name cannot exceed 50 characters'),
  slug: z.string().max(60).regex(/^[a-z0-9-]*$/, 'Slug can only contain lowercase alphanumeric characters and hyphens').optional(),
  active: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50).optional(),
  slug: z.string().max(60).regex(/^[a-z0-9-]*$/).optional(),
  active: z.boolean().optional(),
});

export const reorderCategorySchema = z.object({
  categoryIds: z.array(z.string().uuid('Invalid category ID format')),
});

export const categoryController = {
  async listMyCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const categories = await categoryRepository.listByPhotographer(photographer.id);
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { name, active } = req.body;
      const slugInput = req.body.slug ? generateSlug(req.body.slug) : generateSlug(name);
      const cleanSlug = slugInput || 'category-' + Date.now();

      // Check duplicate slug for this photographer
      const existing = await categoryRepository.findBySlug(photographer.id, cleanSlug);
      if (existing) {
        res.status(400).json({
          success: false,
          message: 'A category with this name or slug already exists in your portfolio.',
        });
        return;
      }

      const currentCategories = await categoryRepository.listByPhotographer(photographer.id);
      const newCategory = await categoryRepository.create({
        photographer_id: photographer.id,
        name: name.trim(),
        slug: cleanSlug,
        active: active !== undefined ? active : true,
        display_order: currentCategories.length,
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: newCategory,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { id } = req.params;
      const category = await categoryRepository.findById(id);

      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      // IDOR Protection: Check ownership
      if (category.photographer_id !== photographer.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to modify this category.',
        });
        return;
      }

      const updates: any = {};
      if (req.body.name !== undefined) updates.name = req.body.name.trim();
      if (req.body.slug !== undefined) {
        const cleanSlug = generateSlug(req.body.slug);
        const existing = await categoryRepository.findBySlug(photographer.id, cleanSlug);
        if (existing && existing.id !== id) {
          res.status(400).json({
            success: false,
            message: 'A category with this slug already exists.',
          });
          return;
        }
        updates.slug = cleanSlug;
      }
      if (req.body.active !== undefined) updates.active = req.body.active;

      const updated = await categoryRepository.update(id, updates);
      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { id } = req.params;
      const category = await categoryRepository.findById(id);

      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      // IDOR Protection: Check ownership
      if (category.photographer_id !== photographer.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to delete this category.',
        });
        return;
      }

      await categoryRepository.delete(id);
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async reorderCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { categoryIds } = req.body;
      if (!Array.isArray(categoryIds)) {
        res.status(400).json({ success: false, message: 'categoryIds array is required' });
        return;
      }

      // Verify all categories belong to this photographer
      for (const id of categoryIds) {
        const cat = await categoryRepository.findById(id);
        if (!cat || cat.photographer_id !== photographer.id) {
          res.status(403).json({
            success: false,
            message: 'Forbidden: One or more categories do not belong to your profile.',
          });
          return;
        }
      }

      await categoryRepository.reorder(photographer.id, categoryIds);
      const reordered = await categoryRepository.listByPhotographer(photographer.id);

      res.status(200).json({
        success: true,
        message: 'Categories reordered successfully',
        data: reordered,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPublicCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const photographer = await profileRepository.findBySlug(slug);
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer not found' });
        return;
      }

      const categories = await categoryRepository.listByPhotographer(photographer.id, true);
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },
};
