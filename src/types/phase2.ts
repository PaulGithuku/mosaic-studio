export interface Category {
  id: string;
  photographer_id: string;
  name: string;
  slug: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioImage {
  id: string;
  photographer_id: string;
  category_id?: string | null;
  category_name?: string | null;
  storage_path: string;
  public_url: string;
  title?: string | null;
  description?: string | null;
  featured: boolean;
  display_order: number;
  width?: number | null;
  height?: number | null;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  photographer_id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  duration_minutes: number;
  category?: string | null;
  featured: boolean;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityDay {
  id: string;
  photographer_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // '09:00'
  end_time: string; // '17:00'
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
}

export interface MonthlyTrend {
  month: string; // e.g. 'Jan 2026'
  bookings: number;
  revenue: number;
}

export interface MostBookedServiceStat {
  id?: string;
  name: string;
  count: number;
  revenue: number;
}

export interface DashboardStats {
  metrics: {
    portfolioCount: number;
    serviceCount: number;
    activeDaysCount: number;
    isAvailabilityConfigured: boolean;
    completionPercentage: number;
    pendingCount?: number;
    upcomingCount?: number;
    completedCount?: number;
    confirmedCount?: number;
    cancelledCount?: number;
    totalRevenue?: number;
    totalBookings?: number;
    averageBookingValue?: number;
    mostBookedService?: MostBookedServiceStat | null;
    monthlyTrends?: MonthlyTrend[];
  };
  checklist: ChecklistItem[];
  profile: {
    id: string;
    name: string;
    slug: string;
    email: string;
    profile_image_path?: string | null;
  };
}
