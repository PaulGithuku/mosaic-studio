import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studioService } from '../../services/studioService';
import { DashboardStats } from '../../types/phase2';
import { DashboardOverviewSkeleton } from '../../components/ui/Skeletons';
import { StudioPreviewModal } from '../../components/dashboard/StudioPreviewModal';
import {
  Camera,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  ShieldCheck,
  Globe,
  ArrowUpRight,
  Layers,
  Calendar,
  Image as ImageIcon,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Award,
  BarChart3,
  CalendarCheck2,
  Copy,
  ExternalLink,
  Plus,
  Upload,
  Check,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const DashboardOverviewPage: React.FC = () => {
  const { currentUser, photographer } = useAuth();
  const { addToast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await studioService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      addToast('Failed to load latest analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const publicUrl = `/p/${photographer?.slug || 'studio'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + publicUrl);
    addToast('Public studio URL copied to clipboard', 'success');
  };

  if (loading) {
    return <DashboardOverviewSkeleton />;
  }

  const metrics = stats?.metrics || {
    portfolioCount: 0,
    serviceCount: 0,
    activeDaysCount: 0,
    isAvailabilityConfigured: false,
    completionPercentage: 0,
    pendingCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    mostBookedService: null,
    monthlyTrends: [],
  };

  const checklist = stats?.checklist || [];
  const monthlyTrends = metrics.monthlyTrends || [];
  const maxRevenueInTrends = Math.max(...monthlyTrends.map((t) => t.revenue), 1000);

  return (
    <div className="space-y-8">
      {/* Studio Header Banner */}
      <div className="bg-[#121212] border border-[#222222] rounded-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C9A86A]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[10px] uppercase font-mono tracking-wider font-semibold rounded-sm bg-[#C9A86A]/20 text-[#E5CA92] border border-[#C9A86A]/40">
                Phase 5 Commercial Active
              </span>
              <span className="text-xs font-mono text-[#888888]">
                Studio ID: {photographer?.slug || 'pending'}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl text-[#F7F5F0] font-light tracking-tight">
              Welcome back, {photographer?.name || currentUser?.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#A0A0A0] mt-2 max-w-2xl leading-relaxed">
              Your commercial studio management platform is live. Oversee client bookings, revenue performance, visual portfolio catalog, and scheduling.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="p-3 bg-[#181818] border border-[#2A2A2A] rounded-sm">
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#666666] mb-1">
                Studio Handle
              </div>
              <div className="text-sm font-mono text-[#F7F5F0] font-medium flex items-center gap-2">
                <span className="text-[#C9A86A]">@</span>
                <span>{photographer?.slug}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1A1A1A] hover:bg-[#252525] text-[#D0D0D0] text-xs font-mono uppercase tracking-wider border border-[#333333] transition-colors rounded-sm"
              >
                <Eye className="w-3.5 h-3.5 text-[#C9A86A]" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1A1A1A] hover:bg-[#252525] text-[#D0D0D0] text-xs font-mono uppercase tracking-wider border border-[#333333] transition-colors rounded-sm"
              >
                <Copy className="w-3.5 h-3.5 text-[#C9A86A]" />
                <span>Copy URL</span>
              </button>
              {photographer?.slug && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-wider font-semibold transition-colors rounded-sm"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Public View</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Studio Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Pending & Active Bookings */}
        <div className="bg-[#121212] border border-[#1F1F1F] p-5 rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-sm bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-[#C9A86A]">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <Link
                to="/dashboard/bookings"
                className="text-[11px] font-mono text-[#888888] hover:text-[#C9A86A] uppercase"
              >
                Bookings →
              </Link>
            </div>
            <div className="text-xs uppercase font-mono tracking-wider text-[#888888]">
              Active Bookings
            </div>
            <div className="text-2xl font-serif text-[#F7F5F0] mt-1 font-medium">
              {metrics.pendingCount || 0} <span className="text-xs font-mono text-[#D6B952]">pending</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1C1C1C] text-[11px] font-mono text-[#666666]">
            {metrics.upcomingCount || 0} confirmed upcoming
          </div>
        </div>

        {/* Metric 2: Total Revenue */}
        <div className="bg-[#121212] border border-[#1F1F1F] p-5 rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-sm bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-[#C9A86A]">
                <DollarSign className="w-4 h-4" />
              </div>
              <Link
                to="/dashboard/bookings"
                className="text-[11px] font-mono text-[#888888] hover:text-[#C9A86A] uppercase"
              >
                Ledger →
              </Link>
            </div>
            <div className="text-xs uppercase font-mono tracking-wider text-[#888888]">
              Total Revenue
            </div>
            <div className="text-2xl font-serif text-[#F7F5F0] mt-1 font-medium">
              ${(metrics.totalRevenue || 0).toLocaleString()}{' '}
              <span className="text-xs font-mono text-[#666666]">USD</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1C1C1C] text-[11px] font-mono text-[#666666]">
            Avg. ${(metrics.averageBookingValue || 0).toLocaleString()} / booking
          </div>
        </div>

        {/* Metric 3: Portfolio Works */}
        <div className="bg-[#121212] border border-[#1F1F1F] p-5 rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-sm bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-[#C9A86A]">
                <ImageIcon className="w-4 h-4" />
              </div>
              <Link
                to="/dashboard/portfolio"
                className="text-[11px] font-mono text-[#888888] hover:text-[#C9A86A] uppercase"
              >
                Manage →
              </Link>
            </div>
            <div className="text-xs uppercase font-mono tracking-wider text-[#888888]">
              Portfolio Works
            </div>
            <div className="text-2xl font-serif text-[#F7F5F0] mt-1 font-medium">
              {metrics.portfolioCount} <span className="text-xs font-mono text-[#666666]">photos</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1C1C1C] text-[11px] font-mono text-[#666666]">
            {metrics.portfolioCount === 0 ? 'Catalog empty' : 'Active high-res catalog'}
          </div>
        </div>

        {/* Metric 4: Packages & Services */}
        <div className="bg-[#121212] border border-[#1F1F1F] p-5 rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-sm bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-[#C9A86A]">
                <Sparkles className="w-4 h-4" />
              </div>
              <Link
                to="/dashboard/services"
                className="text-[11px] font-mono text-[#888888] hover:text-[#C9A86A] uppercase"
              >
                Manage →
              </Link>
            </div>
            <div className="text-xs uppercase font-mono tracking-wider text-[#888888]">
              Active Offerings
            </div>
            <div className="text-2xl font-serif text-[#F7F5F0] mt-1 font-medium">
              {metrics.serviceCount} <span className="text-xs font-mono text-[#666666]">packages</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1C1C1C] text-[11px] font-mono text-[#666666]">
            {metrics.serviceCount === 0 ? 'No packages created' : 'Bookable service offerings'}
          </div>
        </div>
      </div>

      {/* Analytics & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Booking & Revenue Trend (2 cols) */}
        <div className="lg:col-span-2 bg-[#121212] border border-[#1F1F1F] rounded-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C9A86A]" />
              <span>Studio Booking & Revenue Volume</span>
            </h3>
            <span className="text-xs font-mono text-[#888888]">Past 6 Months</span>
          </div>

          {monthlyTrends.length === 0 || monthlyTrends.every((t) => t.bookings === 0) ? (
            <div className="py-12 text-center bg-[#151515] border border-dashed border-[#222222] rounded-sm">
              <BarChart3 className="w-8 h-8 mx-auto text-[#444444] mb-2" />
              <p className="text-xs font-mono text-[#888888]">
                No booking history recorded yet. Inquiries will populate revenue charts.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-6 gap-3 items-end h-40 pt-4 px-2 border-b border-[#1F1F1F]">
                {monthlyTrends.map((trend, i) => {
                  const heightPercent =
                    maxRevenueInTrends > 0
                      ? Math.max(Math.round((trend.revenue / maxRevenueInTrends) * 100), trend.bookings > 0 ? 15 : 4)
                      : 4;

                  return (
                    <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-mono text-[#A0A0A0] opacity-0 group-hover:opacity-100 transition-opacity">
                        ${trend.revenue.toLocaleString()}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[42px] rounded-t-xs transition-all duration-500 ${
                          trend.revenue > 0
                            ? 'bg-gradient-to-t from-[#9B7B3B] to-[#C9A86A]'
                            : 'bg-[#1E1E1E]'
                        }`}
                      />
                      <div className="text-[11px] font-mono text-[#777777] uppercase">
                        {trend.month}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-[#777777] pt-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#C9A86A] rounded-xs inline-block" />
                    <span>Revenue Growth</span>
                  </span>
                  <span>Total Volume: {metrics.totalBookings || 0} commissions</span>
                </div>
                <Link
                  to="/dashboard/bookings"
                  className="text-[#C9A86A] hover:underline uppercase text-[11px]"
                >
                  View Bookings Ledger →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Most Booked Offering Card (1 col) */}
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-[#C9A86A]" />
              <span>Top Package Performance</span>
            </h3>

            {metrics.mostBookedService ? (
              <div className="p-4 bg-[#161616] border border-[#262626] rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] uppercase font-mono bg-[#C9A86A]/20 text-[#E5CA92] rounded-xs border border-[#C9A86A]/30">
                    Highest Demand
                  </span>
                  <span className="text-xs font-mono text-[#888888]">
                    {metrics.mostBookedService.count} Bookings
                  </span>
                </div>
                <div>
                  <h4 className="font-serif text-base text-[#F7F5F0]">
                    {metrics.mostBookedService.name}
                  </h4>
                  <p className="text-xs font-mono text-[#C9A86A] mt-1">
                    ${metrics.mostBookedService.revenue.toLocaleString()} Revenue Generated
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center bg-[#151515] border border-dashed border-[#222222] rounded-sm">
                <Sparkles className="w-6 h-6 mx-auto text-[#444444] mb-2" />
                <p className="text-xs font-mono text-[#888888]">
                  No package data available yet.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#1C1C1C]">
            <Link
              to="/dashboard/services"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#181818] hover:bg-[#222222] text-[#D0D0D0] hover:text-[#F7F5F0] text-xs font-mono uppercase tracking-wider border border-[#2E2E2E] rounded-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#C9A86A]" />
              <span>Create New Package</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Studio Onboarding Checklist & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Checklist (2 cols) */}
        <div className="lg:col-span-2 bg-[#121212] border border-[#1F1F1F] rounded-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C9A86A]" />
              <span>Studio Launch Checklist</span>
            </h3>
            <span className="text-xs font-mono text-[#888888]">
              {checklist.filter((c) => c.completed).length} of {checklist.length} Completed
            </span>
          </div>

          <div className="divide-y divide-[#1A1A1A]">
            {checklist.map((item) => {
              let targetRoute = '/dashboard/profile';
              if (item.id === 'portfolio') targetRoute = '/dashboard/portfolio';
              if (item.id === 'services') targetRoute = '/dashboard/services';
              if (item.id === 'availability') targetRoute = '/dashboard/calendar';

              return (
                <div
                  key={item.id}
                  className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        item.completed
                          ? 'bg-[#C9A86A] text-[#0B0B0B]'
                          : 'bg-[#1C1C1C] border border-[#333333] text-[#555555]'
                      }`}
                    >
                      {item.completed ? <Check className="w-3 h-3 stroke-[3]" /> : '•'}
                    </div>
                    <div>
                      <span
                        className={`text-sm ${
                          item.completed ? 'text-[#D0D0D0] line-through decoration-[#444444]' : 'text-[#F7F5F0]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={targetRoute}
                    className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
                      item.completed
                        ? 'bg-[#181818] text-[#777777] hover:text-[#C9A86A]'
                        : 'bg-[#C9A86A]/15 border border-[#C9A86A]/40 text-[#E5CA92] hover:bg-[#C9A86A]/25'
                    }`}
                  >
                    {item.completed ? 'Edit' : 'Complete →'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Studio Shortcuts (1 col) */}
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-sm p-6 space-y-4">
          <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C9A86A]" />
            <span>Studio Shortcuts</span>
          </h3>

          <div className="space-y-2.5">
            <Link
              to="/dashboard/bookings"
              className="flex items-center justify-between p-3 bg-[#161616] hover:bg-[#1D1D1D] border border-[#222222] rounded-sm transition-colors group"
            >
              <div className="flex items-center gap-3">
                <CalendarCheck2 className="w-4 h-4 text-[#C9A86A]" />
                <span className="text-xs font-mono uppercase text-[#D0D0D0] group-hover:text-[#F7F5F0]">
                  Manage Client Bookings
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#C9A86A]" />
            </Link>

            <Link
              to="/dashboard/portfolio"
              className="flex items-center justify-between p-3 bg-[#161616] hover:bg-[#1D1D1D] border border-[#222222] rounded-sm transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-[#C9A86A]" />
                <span className="text-xs font-mono uppercase text-[#D0D0D0] group-hover:text-[#F7F5F0]">
                  Upload Photographs
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#C9A86A]" />
            </Link>

            <Link
              to="/dashboard/services"
              className="flex items-center justify-between p-3 bg-[#161616] hover:bg-[#1D1D1D] border border-[#222222] rounded-sm transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-4 h-4 text-[#C9A86A]" />
                <span className="text-xs font-mono uppercase text-[#D0D0D0] group-hover:text-[#F7F5F0]">
                  Create Pricing Package
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#C9A86A]" />
            </Link>

            <Link
              to="/dashboard/calendar"
              className="flex items-center justify-between p-3 bg-[#161616] hover:bg-[#1D1D1D] border border-[#222222] rounded-sm transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#C9A86A]" />
                <span className="text-xs font-mono uppercase text-[#D0D0D0] group-hover:text-[#F7F5F0]">
                  Set Working Hours
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#C9A86A]" />
            </Link>

            <Link
              to="/dashboard/profile"
              className="flex items-center justify-between p-3 bg-[#161616] hover:bg-[#1D1D1D] border border-[#222222] rounded-sm transition-colors group"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#C9A86A]" />
                <span className="text-xs font-mono uppercase text-[#D0D0D0] group-hover:text-[#F7F5F0]">
                  Edit Bio & Specialties
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#C9A86A]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Studio Live Preview Modal */}
      {photographer?.slug && (
        <StudioPreviewModal
          slug={photographer.slug}
          photographerName={photographer.name || currentUser?.name}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
};


