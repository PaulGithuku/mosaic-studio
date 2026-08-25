import { api } from './api';
import {
  Booking,
  BookingFilters,
  BookingStatus,
  AvailabilitySlotsResponse,
  CreateBookingPayload,
} from '../types/booking';

export const bookingClientService = {
  /**
   * Query available slots for a photographer, service, and date
   */
  async getAvailableSlots(
    photographerSlug: string,
    serviceId: string,
    date: string
  ): Promise<AvailabilitySlotsResponse> {
    const res = await api.get('/bookings/available-slots', {
      params: {
        photographerSlug,
        serviceId,
        date,
      },
    });
    return res.data;
  },

  /**
   * Submit a new customer booking reservation
   */
  async createBooking(payload: CreateBookingPayload): Promise<{ message: string; booking: Booking }> {
    const res = await api.post('/bookings', payload);
    return res.data;
  },

  /**
   * Public retrieval of booking confirmation by reference
   */
  async getBookingByReference(reference: string): Promise<Booking> {
    const res = await api.get(`/bookings/reference/${encodeURIComponent(reference)}`);
    return res.data;
  },

  /**
   * Authenticated: List bookings for the logged-in photographer
   */
  async listMyBookings(filters?: BookingFilters): Promise<Booking[]> {
    const res = await api.get('/photographers/bookings', {
      params: filters,
    });
    return res.data;
  },

  /**
   * Authenticated: Get single booking record
   */
  async getBookingDetails(id: string): Promise<Booking> {
    const res = await api.get(`/photographers/bookings/${id}`);
    return res.data;
  },

  /**
   * Authenticated: Update booking status (confirm, decline, cancel, complete)
   */
  async updateStatus(
    id: string,
    status: BookingStatus,
    reason?: string
  ): Promise<{ message: string; booking: Booking }> {
    const res = await api.patch(`/photographers/bookings/${id}/status`, {
      status,
      reason,
    });
    return res.data;
  },

  /**
   * Authenticated: Reschedule an existing booking to a new date/time
   */
  async reschedule(
    id: string,
    booking_date: string,
    start_time: string
  ): Promise<{ message: string; booking: Booking }> {
    const res = await api.post(`/photographers/bookings/${id}/reschedule`, {
      booking_date,
      start_time,
    });
    return res.data;
  },
};
