import { Request, Response } from 'express';
import { z } from 'zod';
import { bookingService } from '../services/bookingService';
import { bookingRepository, profileRepository, BookingStatus } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

/**
 * Helper to ensure photographer profile exists for authenticated user
 */
async function resolvePhotographerId(req: AuthRequest): Promise<string | null> {
  if (req.profile?.id) {
    return req.profile.id;
  }
  if (req.user) {
    try {
      const prof = await profileRepository.ensureProfile({
        user_id: req.user.id,
        email: req.user.email,
        name: req.user.user_metadata?.name || req.user.email.split('@')[0] || 'Photographer',
      });
      if (prof) {
        req.profile = prof;
        return prof.id;
      }
    } catch (err: any) {
      console.warn('[BookingController] Failed to auto-resolve photographer profile:', err?.message);
    }
  }
  return null;
}

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------
export const createBookingSchema = z.object({
  photographer_slug: z.string().optional(),
  photographer_id: z.string().optional(),
  service_id: z.string().min(1, 'Service ID is required'),
  booking_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Booking date must be in YYYY-MM-DD format'),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  customer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  customer_email: z.string().email('Valid email address is required'),
  customer_phone: z.string().max(30).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'declined', 'cancelled', 'completed']),
  reason: z.string().max(500).optional(),
});

export const rescheduleBookingSchema = z.object({
  booking_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'New booking date must be in YYYY-MM-DD format'),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'New start time must be in HH:MM format'),
});

// -----------------------------------------------------------------------------
// Controller Methods
// -----------------------------------------------------------------------------
export const bookingController = {
  /**
   * Public: Query available time slots for a photographer, service, and date
   * GET /api/bookings/available-slots?photographerSlug=...&serviceId=...&date=YYYY-MM-DD
   */
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const photographerSlug = (req.query.photographerSlug as string) || (req.query.photographerId as string);
      const serviceId = req.query.serviceId as string;
      const date = req.query.date as string;

      if (!photographerSlug || !serviceId || !date) {
        res.status(400).json({
          error: 'Missing required query parameters: photographerSlug, serviceId, and date.',
        });
        return;
      }

      const result = await bookingService.getAvailableSlots(photographerSlug, serviceId, date);
      res.status(200).json(result);
    } catch (err: any) {
      console.warn('[BookingController] getAvailableSlots error:', err.message);
      res.status(400).json({ error: err.message || 'Failed to fetch available slots.' });
    }
  },

  /**
   * Public: Create a new booking
   * POST /api/bookings
   */
  async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const validated = createBookingSchema.parse(req.body);
      const booking = await bookingService.createBooking(validated);

      res.status(201).json({
        message: 'Booking request created successfully.',
        booking,
      });
    } catch (err: any) {
      console.warn('[BookingController] createBooking error:', err.message);
      if (err.code === 'OVERLAPPING_BOOKING_CONFLICT' || err.message?.includes('DOUBLE_BOOKING')) {
        res.status(409).json({
          error: 'The requested time slot was just reserved by another client. Please select another slot.',
          code: 'OVERLAPPING_BOOKING_CONFLICT',
        });
        return;
      }
      res.status(400).json({ error: err.message || 'Failed to create booking.' });
    }
  },

  /**
   * Public: Get booking confirmation details by reference code
   * GET /api/bookings/reference/:reference
   */
  async getBookingByReference(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.params;
      const booking = await bookingService.getBookingByReference(reference);

      // Return sanitized booking info
      res.status(200).json({
        id: booking.id,
        booking_reference: booking.booking_reference,
        photographer_name: booking.photographer_name,
        photographer_slug: booking.photographer_slug,
        service_name: booking.service_name,
        service_duration: booking.service_duration,
        currency: booking.currency,
        price: booking.price,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        location: booking.location,
        message: booking.message,
        created_at: booking.created_at,
      });
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Booking not found.' });
    }
  },

  /**
   * Authenticated: List bookings for logged-in photographer
   * GET /api/photographers/bookings
   */
  async listMyBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const photographerId = await resolvePhotographerId(req);
      if (!photographerId) {
        res.status(401).json({ error: 'Photographer profile required.' });
        return;
      }

      const status = req.query.status as BookingStatus | 'upcoming' | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const search = req.query.search as string | undefined;

      const bookings = await bookingRepository.listByPhotographer(photographerId, {
        status,
        startDate,
        endDate,
        search,
      });

      res.status(200).json(bookings);
    } catch (err: any) {
      console.error('[BookingController] listMyBookings error:', err);
      res.status(500).json({ error: err.message || 'Failed to list bookings.' });
    }
  },

  /**
   * Authenticated: Get single booking details
   * GET /api/photographers/bookings/:id
   */
  async getBookingDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const photographerId = await resolvePhotographerId(req);
      if (!photographerId) {
        res.status(401).json({ error: 'Photographer profile required.' });
        return;
      }

      const { id } = req.params;
      const booking = await bookingRepository.findById(id, photographerId);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found.' });
        return;
      }

      res.status(200).json(booking);
    } catch (err: any) {
      console.error('[BookingController] getBookingDetails error:', err);
      res.status(500).json({ error: err.message || 'Failed to get booking details.' });
    }
  },

  /**
   * Authenticated: Update booking status (confirm, decline, cancel, complete)
   * PATCH /api/photographers/bookings/:id/status
   */
  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const photographerId = await resolvePhotographerId(req);
      if (!photographerId) {
        res.status(401).json({ error: 'Photographer profile required.' });
        return;
      }

      const { id } = req.params;
      const { status, reason } = updateBookingStatusSchema.parse(req.body);

      const updated = await bookingService.updateBookingStatus(
        id,
        photographerId,
        status as BookingStatus,
        reason
      );

      res.status(200).json({
        message: `Booking status updated to ${status}.`,
        booking: updated,
      });
    } catch (err: any) {
      console.warn('[BookingController] updateStatus error:', err.message);
      res.status(400).json({ error: err.message || 'Failed to update booking status.' });
    }
  },

  /**
   * Authenticated: Reschedule a booking
   * POST /api/photographers/bookings/:id/reschedule
   */
  async reschedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const photographerId = await resolvePhotographerId(req);
      if (!photographerId) {
        res.status(401).json({ error: 'Photographer profile required.' });
        return;
      }

      const { id } = req.params;
      const { booking_date, start_time } = rescheduleBookingSchema.parse(req.body);

      const rescheduled = await bookingService.rescheduleBooking(
        id,
        photographerId,
        booking_date,
        start_time
      );

      res.status(200).json({
        message: 'Booking rescheduled successfully.',
        booking: rescheduled,
      });
    } catch (err: any) {
      console.warn('[BookingController] reschedule error:', err.message);
      if (err.code === 'OVERLAPPING_BOOKING_CONFLICT' || err.message?.includes('CONFLICT')) {
        res.status(409).json({
          error: 'The requested reschedule slot is already occupied by another session.',
          code: 'OVERLAPPING_BOOKING_CONFLICT',
        });
        return;
      }
      res.status(400).json({ error: err.message || 'Failed to reschedule booking.' });
    }
  },
};
