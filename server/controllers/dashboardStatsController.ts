import { Response, NextFunction } from 'express';
import {
  portfolioRepository,
  serviceRepository,
  availabilityRepository,
  profileRepository,
  bookingRepository,
} from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const dashboardStatsController = {
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let photographer = req.profile;
      if (!photographer && req.user) {
        photographer = await profileRepository.ensureProfile({
          user_id: req.user.id,
          email: req.user.email,
          name: req.user.user_metadata?.name || req.user.email.split('@')[0] || 'Photographer',
        });
        req.profile = photographer;
      }

      if (!photographer) {
        res.status(404).json({ success: false, message: 'Photographer profile not found' });
        return;
      }

      // 1. Fetch real counts
      const [portfolioCount, serviceCount, availabilitySchedule, bookingStats] = await Promise.all([
        portfolioRepository.countByPhotographer(photographer.id),
        serviceRepository.countByPhotographer(photographer.id),
        availabilityRepository.getSchedule(photographer.id),
        bookingRepository.getDashboardBookingStats(photographer.id),
      ]);

      const activeDaysCount = availabilitySchedule.filter((d) => d.enabled).length;
      const isAvailabilityConfigured = activeDaysCount > 0;

      // 2. Compute profile completion checklist
      const checklist = [
        {
          id: 'basic_info',
          label: 'Basic Studio Identity (Name & Slug)',
          completed: Boolean(photographer.name && photographer.slug),
          weight: 20,
        },
        {
          id: 'bio',
          label: 'Editorial Biography',
          completed: Boolean(photographer.bio && photographer.bio.trim().length >= 10),
          weight: 15,
        },
        {
          id: 'profile_image',
          label: 'Studio Avatar / Portrait',
          completed: Boolean(photographer.profile_image_path && photographer.profile_image_path.trim().length > 0),
          weight: 15,
        },
        {
          id: 'location',
          label: 'Primary Studio Location',
          completed: Boolean(photographer.location && photographer.location.trim().length > 0),
          weight: 10,
        },
        {
          id: 'specialties',
          label: 'Photography Specialties',
          completed: Boolean(photographer.specialties && photographer.specialties.length > 0),
          weight: 10,
        },
        {
          id: 'socials',
          label: 'Contact & Social Links',
          completed: Boolean(photographer.instagram || photographer.website || photographer.phone || photographer.whatsapp),
          weight: 10,
        },
        {
          id: 'portfolio',
          label: 'Upload First Portfolio Work',
          completed: portfolioCount > 0,
          weight: 10,
        },
        {
          id: 'availability',
          label: 'Configure Working Hours',
          completed: isAvailabilityConfigured,
          weight: 10,
        },
      ];

      const completionPercentage = checklist.reduce(
        (acc, item) => (item.completed ? acc + item.weight : acc),
        0
      );

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            portfolioCount,
            serviceCount,
            activeDaysCount,
            isAvailabilityConfigured,
            completionPercentage,
            ...bookingStats,
          },
          checklist,
          profile: {
            id: photographer.id,
            name: photographer.name,
            slug: photographer.slug,
            email: photographer.email,
            profile_image_path: photographer.profile_image_path,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

