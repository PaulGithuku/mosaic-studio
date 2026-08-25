import { Router } from 'express';
import authRoutes from './authRoutes';
import { photographerController, updateProfileSchema } from '../controllers/photographerController';
import { categoryController, createCategorySchema, updateCategorySchema, reorderCategorySchema } from '../controllers/categoryController';
import { portfolioController, updatePortfolioImageSchema, reorderPortfolioImagesSchema } from '../controllers/portfolioController';
import { serviceController, createServiceSchema, updateServiceSchema } from '../controllers/serviceController';
import { availabilityController, saveAvailabilitySchema } from '../controllers/availabilityController';
import {
  bookingController,
  createBookingSchema,
  updateBookingStatusSchema,
  rescheduleBookingSchema,
} from '../controllers/bookingController';
import { dashboardStatsController } from '../controllers/dashboardStatsController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { upload, handleMulterError } from '../middleware/upload';
import { isSupabaseConfigured } from '../config/supabase';

const apiRouter = Router();

// ==========================================
// 1. Health & Status
// ==========================================
apiRouter.get('/health', (_req, res) => {
  const supabaseActive = isSupabaseConfigured();
  res.status(200).json({
    status: 'ok',
    service: 'MOSAIC STUDIO API',
    version: '4.0.0 (Phase 4 — Complete Booking Engine & Management)',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Supabase PostgreSQL',
      connected: true,
      mode: supabaseActive ? 'supabase-cloud' : 'supabase-local-persistence',
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// ==========================================
// 2. Authentication Routes
// ==========================================
apiRouter.use('/auth', authRoutes);

// ==========================================
// 3. Dashboard Real-Time Metrics & Checklist
// ==========================================
apiRouter.get(
  '/photographers/dashboard-stats',
  authenticateToken,
  dashboardStatsController.getStats
);

// ==========================================
// 4. Photographer Profile Management
// ==========================================
apiRouter.put(
  '/photographers/profile',
  authenticateToken,
  validateBody(updateProfileSchema),
  photographerController.updateProfile
);

apiRouter.post(
  '/photographers/profile/avatar',
  authenticateToken,
  upload.single('avatar'),
  handleMulterError,
  photographerController.uploadAvatar
);

apiRouter.delete(
  '/photographers/profile/avatar',
  authenticateToken,
  photographerController.removeAvatar
);

// ==========================================
// 5. Portfolio Categories
// ==========================================
apiRouter.get(
  '/photographers/categories',
  authenticateToken,
  categoryController.listMyCategories
);

apiRouter.post(
  '/photographers/categories',
  authenticateToken,
  validateBody(createCategorySchema),
  categoryController.createCategory
);

apiRouter.put(
  '/photographers/categories/reorder',
  authenticateToken,
  validateBody(reorderCategorySchema),
  categoryController.reorderCategories
);

apiRouter.put(
  '/photographers/categories/:id',
  authenticateToken,
  validateBody(updateCategorySchema),
  categoryController.updateCategory
);

apiRouter.delete(
  '/photographers/categories/:id',
  authenticateToken,
  categoryController.deleteCategory
);

// ==========================================
// 6. Portfolio Images & Uploads
// ==========================================
apiRouter.get(
  '/photographers/portfolio',
  authenticateToken,
  portfolioController.listMyImages
);

apiRouter.post(
  '/photographers/portfolio/upload',
  authenticateToken,
  upload.single('image'),
  handleMulterError,
  portfolioController.uploadImage
);

apiRouter.put(
  '/photographers/portfolio/reorder',
  authenticateToken,
  validateBody(reorderPortfolioImagesSchema),
  portfolioController.reorderImages
);

apiRouter.put(
  '/photographers/portfolio/:id',
  authenticateToken,
  validateBody(updatePortfolioImageSchema),
  portfolioController.updateImage
);

apiRouter.delete(
  '/photographers/portfolio/:id',
  authenticateToken,
  portfolioController.deleteImage
);

// ==========================================
// 7. Services & Offerings
// ==========================================
apiRouter.get(
  '/photographers/services',
  authenticateToken,
  serviceController.listMyServices
);

apiRouter.post(
  '/photographers/services',
  authenticateToken,
  validateBody(createServiceSchema),
  serviceController.createService
);

apiRouter.put(
  '/photographers/services/:id',
  authenticateToken,
  validateBody(updateServiceSchema),
  serviceController.updateService
);

apiRouter.delete(
  '/photographers/services/:id',
  authenticateToken,
  serviceController.deleteService
);

// ==========================================
// 8. Availability & Working Hours
// ==========================================
apiRouter.get(
  '/photographers/availability',
  authenticateToken,
  availabilityController.getMySchedule
);

apiRouter.put(
  '/photographers/availability',
  authenticateToken,
  validateBody(saveAvailabilitySchema),
  availabilityController.saveMySchedule
);

// ==========================================
// 9. Authenticated Booking Management (Dashboard)
// ==========================================
apiRouter.get('/photographers/bookings', authenticateToken, bookingController.listMyBookings);
apiRouter.get('/photographers/bookings/:id', authenticateToken, bookingController.getBookingDetails);
apiRouter.patch(
  '/photographers/bookings/:id/status',
  authenticateToken,
  validateBody(updateBookingStatusSchema),
  bookingController.updateStatus
);
apiRouter.post(
  '/photographers/bookings/:id/reschedule',
  authenticateToken,
  validateBody(rescheduleBookingSchema),
  bookingController.reschedule
);

// ==========================================
// 10. Public Photographer Studio Endpoints
// ==========================================
apiRouter.get('/photographers/:slug', photographerController.getBySlug);
apiRouter.get('/photographers/:slug/full', photographerController.getPublicStudioFull);
apiRouter.get('/photographers/:slug/categories', categoryController.getPublicCategories);
apiRouter.get('/photographers/:slug/portfolio', portfolioController.getPublicPortfolio);
apiRouter.get('/photographers/:slug/services', serviceController.getPublicServices);
apiRouter.get('/photographers/:slug/availability', availabilityController.getPublicAvailability);

// ==========================================
// 11. Public Booking Engine Endpoints
// ==========================================
apiRouter.get('/bookings/available-slots', bookingController.getAvailableSlots);
apiRouter.post('/bookings', validateBody(createBookingSchema), bookingController.createBooking);
apiRouter.get('/bookings/reference/:reference', bookingController.getBookingByReference);

export default apiRouter;
