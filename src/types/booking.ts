export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'declined'
  | 'rescheduled'
  | 'completed';

export interface Booking {
  id: string;
  photographer_id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  location?: string | null;
  message?: string | null;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  price: number;
  status: BookingStatus;
  booking_reference: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  service_name?: string;
  service_duration?: number;
  currency?: string;
  photographer_name?: string;
  photographer_slug?: string;
  photographer_email?: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  reason?: string;
}

export interface AvailabilitySlotsResponse {
  date: string;
  day_of_week: number;
  is_operating_day: boolean;
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
    currency: string;
  };
  photographer: {
    id: string;
    name: string;
    slug: string;
  };
  slots: TimeSlot[];
}

export interface CreateBookingPayload {
  photographer_slug?: string;
  photographer_id?: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  location?: string;
  message?: string;
}

export interface BookingFilters {
  status?: BookingStatus | 'upcoming';
  startDate?: string;
  endDate?: string;
  search?: string;
}
