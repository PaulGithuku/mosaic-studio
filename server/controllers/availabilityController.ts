import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { availabilityRepository, profileRepository } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const dayScheduleSchema = z.object({
  day_of_week: z.number().int().min(0, 'Day of week must be between 0 (Sun) and 6 (Sat)').max(6),
  start_time: z.string().regex(timeRegex, 'Start time must be formatted as HH:MM'),
  end_time: z.string().regex(timeRegex, 'End time must be formatted as HH:MM'),
  enabled: z.boolean(),
}).refine(
  (data) => {
    if (!data.enabled) return true; // Disabled days don't require strict start < end
    const [startH, startM] = data.start_time.split(':').map(Number);
    const [endH, endM] = data.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return startMinutes < endMinutes;
  },
  {
    message: 'Start time must be earlier than end time',
    path: ['start_time'],
  }
);

export const saveAvailabilitySchema = z.object({
  days: z.array(dayScheduleSchema).min(1, 'At least one day schedule must be provided').max(7),
});

export const availabilityController = {
  async getMySchedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const schedule = await availabilityRepository.getSchedule(photographer.id);
      res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  },

  async saveMySchedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const photographer = req.profile;
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      const { days } = req.body;
      const saved = await availabilityRepository.saveSchedule(photographer.id, days);

      res.status(200).json({
        success: true,
        message: 'Availability schedule saved successfully',
        data: saved,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPublicAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const photographer = await profileRepository.findBySlug(slug);
      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer not found' });
        return;
      }

      const schedule = await availabilityRepository.getSchedule(photographer.id);
      res.status(200).json({
        success: true,
        data: schedule.filter((d) => d.enabled),
      });
    } catch (error) {
      next(error);
    }
  },
};
