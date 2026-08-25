import crypto from 'crypto';
import {
  bookingRepository,
  profileRepository,
  serviceRepository,
  availabilityRepository,
  BookingRecord,
  BookingStatus,
} from '../config/supabase';
import { emailService } from './emailService';

// Time calculation helper utilities
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  return parts[0] * 60 + (parts[1] || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const total = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(total);
}

export function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MOS-${code}`;
}

export interface CreateBookingParams {
  photographer_slug?: string;
  photographer_id?: string;
  service_id: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  location?: string;
  message?: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  reason?: string;
}

export const bookingService = {
  /**
   * Calculates available time slots for a given photographer, service, and date
   */
  async getAvailableSlots(
    photographerSlugOrId: string,
    serviceId: string,
    dateStr: string
  ): Promise<{
    date: string;
    day_of_week: number;
    is_operating_day: boolean;
    service: { id: string; name: string; duration_minutes: number; price: number; currency: string };
    photographer: { id: string; name: string; slug: string };
    slots: TimeSlot[];
  }> {
    // 1. Validate date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr < todayStr) {
      throw new Error('Cannot query availability for past dates.');
    }

    // 2. Fetch photographer
    let photographer = await profileRepository.findBySlug(photographerSlugOrId);
    if (!photographer) {
      photographer = await profileRepository.findById(photographerSlugOrId);
    }
    if (!photographer) {
      throw new Error('Photographer studio not found.');
    }

    // 3. Fetch service
    const service = await serviceRepository.findById(serviceId, photographer.id);
    if (!service || !service.active) {
      throw new Error('Selected service package is invalid or inactive.');
    }

    // 4. Determine day of week
    const dateObj = new Date(`${dateStr}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();

    // 5. Fetch availability schedule
    const schedule = await availabilityRepository.findByPhotographer(photographer.id);
    const dayConfig = schedule.find((s) => s.day_of_week === dayOfWeek);

    if (!dayConfig || !dayConfig.enabled) {
      return {
        date: dateStr,
        day_of_week: dayOfWeek,
        is_operating_day: false,
        service: {
          id: service.id,
          name: service.name,
          duration_minutes: service.duration_minutes,
          price: service.price,
          currency: service.currency,
        },
        photographer: {
          id: photographer.id,
          name: photographer.name,
          slug: photographer.slug,
        },
        slots: [],
      };
    }

    // 6. Calculate possible slots
    const opStartMins = timeToMinutes(dayConfig.start_time);
    const opEndMins = timeToMinutes(dayConfig.end_time);
    const duration = service.duration_minutes || 60;

    // Slot increment step (every 30 mins, or duration if shorter)
    const step = 30;
    const candidateSlots: Array<{ start_time: string; end_time: string }> = [];

    for (let m = opStartMins; m + duration <= opEndMins; m += step) {
      candidateSlots.push({
        start_time: minutesToTime(m),
        end_time: minutesToTime(m + duration),
      });
    }

    // 7. Fetch occupied bookings
    const occupied = await bookingRepository.getOccupiedSlots(photographer.id, dateStr);

    // Current time check for today
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const isToday = dateStr === todayStr;

    // 8. Filter slots against occupied intervals
    const computedSlots: TimeSlot[] = candidateSlots.map((slot) => {
      const slotStartMins = timeToMinutes(slot.start_time);
      const slotEndMins = timeToMinutes(slot.end_time);

      // Check if slot has passed today
      if (isToday && slotStartMins <= currentMins) {
        return {
          ...slot,
          available: false,
          reason: 'Time passed',
        };
      }

      // Check overlapping with any occupied booking
      const hasConflict = occupied.some((occ) => {
        const occStartMins = timeToMinutes(occ.start_time);
        const occEndMins = timeToMinutes(occ.end_time);
        return slotStartMins < occEndMins && slotEndMins > occStartMins;
      });

      if (hasConflict) {
        return {
          ...slot,
          available: false,
          reason: 'Reserved',
        };
      }

      return {
        ...slot,
        available: true,
      };
    });

    return {
      date: dateStr,
      day_of_week: dayOfWeek,
      is_operating_day: true,
      service: {
        id: service.id,
        name: service.name,
        duration_minutes: service.duration_minutes,
        price: service.price,
        currency: service.currency,
      },
      photographer: {
        id: photographer.id,
        name: photographer.name,
        slug: photographer.slug,
      },
      slots: computedSlots,
    };
  },

  /**
   * Creates a new booking reservation with complete server-side trusted validations
   */
  async createBooking(params: CreateBookingParams): Promise<BookingRecord> {
    const {
      photographer_slug,
      photographer_id,
      service_id,
      booking_date,
      start_time,
      customer_name,
      customer_email,
      customer_phone,
      location,
      message,
    } = params;

    // 1. Basic format validations
    if (!customer_name || customer_name.trim().length < 2) {
      throw new Error('Customer name must be at least 2 characters.');
    }
    if (!customer_email || !customer_email.includes('@')) {
      throw new Error('Valid customer email is required.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
      throw new Error('Invalid booking date format. Expected YYYY-MM-DD.');
    }
    if (!/^\d{2}:\d{2}$/.test(start_time)) {
      throw new Error('Invalid start time format. Expected HH:MM.');
    }

    // 2. Reject past bookings
    const todayStr = new Date().toISOString().split('T')[0];
    if (booking_date < todayStr) {
      throw new Error('Cannot book an appointment on a past date.');
    }

    // 3. Resolve photographer
    let photographer = null;
    if (photographer_slug) {
      photographer = await profileRepository.findBySlug(photographer_slug);
    }
    if (!photographer && photographer_id) {
      photographer = await profileRepository.findById(photographer_id);
    }
    if (!photographer) {
      throw new Error('Photographer studio profile not found.');
    }

    // 4. Resolve service & TRUSTED SERVER DATA
    const service = await serviceRepository.findById(service_id, photographer.id);
    if (!service || !service.active) {
      throw new Error('Selected service package is not available or inactive.');
    }

    // Trusted price & calculated end time
    const trustedPrice = Number(service.price);
    const duration = service.duration_minutes || 60;
    const computedEndTime = addMinutesToTime(start_time, duration);

    // 5. Operating hours validation
    const dateObj = new Date(`${booking_date}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();
    const schedule = await availabilityRepository.findByPhotographer(photographer.id);
    const dayConfig = schedule.find((s) => s.day_of_week === dayOfWeek);

    if (!dayConfig || !dayConfig.enabled) {
      throw new Error('Photographer is not accepting bookings on this day of the week.');
    }

    const opStartMins = timeToMinutes(dayConfig.start_time);
    const opEndMins = timeToMinutes(dayConfig.end_time);
    const reqStartMins = timeToMinutes(start_time);
    const reqEndMins = timeToMinutes(computedEndTime);

    if (reqStartMins < opStartMins || reqEndMins > opEndMins) {
      throw new Error(
        `Requested time (${start_time} - ${computedEndTime}) is outside photographer working hours (${dayConfig.start_time} - ${dayConfig.end_time}).`
      );
    }

    // 6. Generate unique booking reference
    let reference = generateBookingReference();
    let collisionCheck = await bookingRepository.findByReference(reference);
    let attempts = 0;
    while (collisionCheck && attempts < 5) {
      reference = generateBookingReference();
      collisionCheck = await bookingRepository.findByReference(reference);
      attempts++;
    }

    // 7. Atomic create in DB (Double Booking Protection)
    const booking = await bookingRepository.create({
      photographer_id: photographer.id,
      service_id: service.id,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim().toLowerCase(),
      customer_phone: customer_phone ? customer_phone.trim() : null,
      location: location ? location.trim() : null,
      message: message ? message.trim() : null,
      booking_date,
      start_time,
      end_time: computedEndTime,
      price: trustedPrice,
      status: 'pending',
      booking_reference: reference,
      service_name: service.name,
      service_duration: duration,
      currency: service.currency,
      photographer_name: photographer.name,
      photographer_slug: photographer.slug,
      photographer_email: photographer.email,
    });

    // 8. Dispatch notification emails asynchronously
    emailService.sendNewBookingToPhotographer(booking, photographer, service).catch((err) => {
      console.warn('[Booking] Email dispatch error:', err.message);
    });

    return booking;
  },

  /**
   * Updates booking status (confirm, decline, cancel, complete)
   */
  async updateBookingStatus(
    bookingId: string,
    photographerId: string,
    status: BookingStatus,
    reason?: string
  ): Promise<BookingRecord> {
    const booking = await bookingRepository.findById(bookingId, photographerId);
    if (!booking) {
      throw new Error('Booking record not found or unauthorized.');
    }

    const updated = await bookingRepository.updateStatus(bookingId, photographerId, status);
    if (!updated) {
      throw new Error('Failed to update booking status.');
    }

    // Dispatch email notifications based on status
    const photographer = await profileRepository.findById(photographerId);
    const service = await serviceRepository.findById(booking.service_id, photographerId);

    if (photographer) {
      if (status === 'confirmed') {
        emailService.sendBookingConfirmedToCustomer(updated, photographer, service).catch(() => {});
      } else if (status === 'declined') {
        emailService.sendBookingDeclinedToCustomer(updated, photographer, service, reason).catch(() => {});
      } else if (status === 'cancelled') {
        emailService.sendBookingCancelledNotification(updated, photographer, service, 'photographer').catch(() => {});
      }
    }

    return updated;
  },

  /**
   * Reschedules an existing booking to a new date and time with conflict check
   */
  async rescheduleBooking(
    bookingId: string,
    photographerId: string,
    newDate: string,
    newStartTime: string
  ): Promise<BookingRecord> {
    const booking = await bookingRepository.findById(bookingId, photographerId);
    if (!booking) {
      throw new Error('Booking record not found or unauthorized.');
    }

    // Validate new date
    const todayStr = new Date().toISOString().split('T')[0];
    if (newDate < todayStr) {
      throw new Error('Cannot reschedule to a past date.');
    }

    // Calculate new end time using duration
    const service = await serviceRepository.findById(booking.service_id, photographerId);
    const duration = service?.duration_minutes || booking.service_duration || 60;
    const newEndTime = addMinutesToTime(newStartTime, duration);

    // Validate operating hours for new date
    const dateObj = new Date(`${newDate}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();
    const schedule = await availabilityRepository.findByPhotographer(photographerId);
    const dayConfig = schedule.find((s) => s.day_of_week === dayOfWeek);

    if (!dayConfig || !dayConfig.enabled) {
      throw new Error('Studio is not operating on the requested reschedule day.');
    }

    const opStartMins = timeToMinutes(dayConfig.start_time);
    const opEndMins = timeToMinutes(dayConfig.end_time);
    const reqStartMins = timeToMinutes(newStartTime);
    const reqEndMins = timeToMinutes(newEndTime);

    if (reqStartMins < opStartMins || reqEndMins > opEndMins) {
      throw new Error(
        `Reschedule slot (${newStartTime} - ${newEndTime}) is outside operating hours (${dayConfig.start_time} - ${dayConfig.end_time}).`
      );
    }

    const oldDate = booking.booking_date;
    const oldStartTime = booking.start_time;

    const rescheduled = await bookingRepository.reschedule(
      bookingId,
      photographerId,
      newDate,
      newStartTime,
      newEndTime
    );

    // Notify client
    const photographer = await profileRepository.findById(photographerId);
    if (photographer) {
      emailService
        .sendBookingRescheduledToCustomer(rescheduled, photographer, service, oldDate, oldStartTime)
        .catch(() => {});
    }

    return rescheduled;
  },

  /**
   * Public retrieval of booking confirmation by reference code
   */
  async getBookingByReference(reference: string): Promise<BookingRecord> {
    if (!reference || reference.trim().length === 0) {
      throw new Error('Booking reference is required.');
    }

    const booking = await bookingRepository.findByReference(reference);
    if (!booking) {
      throw new Error('Booking confirmation not found for this reference.');
    }

    return booking;
  },
};
