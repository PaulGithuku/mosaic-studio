import React, { useState, useEffect, useCallback } from 'react';
import { Booking, BookingStatus } from '../../types/booking';
import { bookingClientService } from '../../services/bookingClientService';
import { BookingsTableSkeleton } from '../../components/ui/Skeletons';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock3,
  RefreshCw,
  AlertCircle,
  MoreVertical,
  CalendarDays,
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  DollarSign,
  ChevronRight,
  Loader2,
  Check,
  X,
  Eye,
  CalendarCheck,
  Ban,
  CalendarRange,
} from 'lucide-react';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Booking for Modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Action Modals State
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statusFilter =
        activeTab === 'all'
          ? undefined
          : (activeTab as BookingStatus | 'upcoming');

      const data = await bookingClientService.listMyBookings({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setBookings(data);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.error || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Actions
  const handleUpdateStatus = async (
    bookingId: string,
    status: BookingStatus,
    reason?: string
  ) => {
    try {
      setActionLoading(true);
      setActionError(null);

      const res = await bookingClientService.updateStatus(bookingId, status, reason);
      setActionSuccess(`Booking ${res.booking.booking_reference} marked as ${status}.`);

      // Update local list
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      );

      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(res.booking);
      }

      setIsDeclineModalOpen(false);
      setDeclineReason('');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to update booking status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const res = await bookingClientService.reschedule(
        selectedBooking.id,
        rescheduleDate,
        rescheduleTime
      );

      setActionSuccess(`Booking ${res.booking.booking_reference} rescheduled to ${rescheduleDate} at ${rescheduleTime}.`);

      setBookings((prev) =>
        prev.map((b) => (b.id === selectedBooking.id ? res.booking : b))
      );

      setSelectedBooking(res.booking);
      setIsRescheduleModalOpen(false);
      setRescheduleDate('');
      setRescheduleTime('');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to reschedule booking.');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics summary
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.price || 0), 0);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-[#292414] border border-[#5A4B26] text-[#D6B952] text-[10px] font-mono uppercase tracking-wider">
            <Clock3 className="w-3 h-3" />
            Pending Review
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-[#14291B] border border-[#265A34] text-[#52D68A] text-[10px] font-mono uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-[#141E29] border border-[#263D5A] text-[#5295D6] text-[10px] font-mono uppercase tracking-wider">
            <Check className="w-3 h-3" />
            Completed
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-[#291414] border border-[#5A2626] text-[#D65252] text-[10px] font-mono uppercase tracking-wider">
            <Ban className="w-3 h-3" />
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-[#291414] border border-[#5A2626] text-[#D65252] text-[10px] font-mono uppercase tracking-wider">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-[#1A1A1A] border border-[#333333] text-[#888888] text-[10px] font-mono uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#1E1E1E] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A] block mb-1">
            Studio Reservations & Schedule
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#F7F5F0]">
            Booking Management
          </h1>
        </div>

        <button
          type="button"
          onClick={() => fetchBookings()}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-[#141414] hover:bg-[#1C1C1C] border border-[#282828] text-xs font-mono uppercase tracking-wider text-[#CCCCCC] rounded-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C9A86A]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-3.5 bg-[#14291B] border border-[#265A34] text-[#52D68A] text-xs font-mono rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-[#2A1414] border border-[#5A2626] text-[#FF8888] text-xs font-mono rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#D6B952] block">
            Pending Actions
          </span>
          <span className="font-serif text-2xl sm:text-3xl text-[#F7F5F0] font-medium block mt-1">
            {pendingCount}
          </span>
          <span className="text-[11px] font-mono text-[#777777] mt-1 block">
            Require confirmation
          </span>
        </div>

        <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#52D68A] block">
            Confirmed Sessions
          </span>
          <span className="font-serif text-2xl sm:text-3xl text-[#F7F5F0] font-medium block mt-1">
            {confirmedCount}
          </span>
          <span className="text-[11px] font-mono text-[#777777] mt-1 block">
            On studio calendar
          </span>
        </div>

        <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5295D6] block">
            Completed Shoots
          </span>
          <span className="font-serif text-2xl sm:text-3xl text-[#F7F5F0] font-medium block mt-1">
            {completedCount}
          </span>
          <span className="text-[11px] font-mono text-[#777777] mt-1 block">
            Total delivered
          </span>
        </div>

        <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] block">
            Booked Volume
          </span>
          <span className="font-serif text-2xl sm:text-3xl text-[#C9A86A] font-medium block mt-1">
            €{totalRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] font-mono text-[#777777] mt-1 block">
            Confirmed commissions
          </span>
        </div>
      </div>

      {/* Filter and Tab Controls */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-[#1E1E1E] pb-2 text-xs font-mono uppercase tracking-wider">
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-[#C9A86A] text-[#080808] font-bold shadow-sm'
                  : 'text-[#888888] hover:text-[#F7F5F0] hover:bg-[#141414]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Date Range Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search reference, client, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121212] border border-[#252525] focus:border-[#C9A86A] text-xs font-mono text-[#F7F5F0] pl-9 pr-3.5 py-2.5 rounded-sm outline-none transition-colors"
            />
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Filter from date"
              className="w-full bg-[#121212] border border-[#252525] focus:border-[#C9A86A] text-xs font-mono text-[#F7F5F0] px-3 py-2 rounded-sm outline-none transition-colors"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Filter to date"
              className="w-full bg-[#121212] border border-[#252525] focus:border-[#C9A86A] text-xs font-mono text-[#F7F5F0] px-3 py-2 rounded-sm outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Bookings List / Table */}
      {loading ? (
        <BookingsTableSkeleton />
      ) : error ? (
        <div className="p-8 bg-[#2A1414] border border-[#552222] rounded-sm text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#FF6666] mx-auto" />
          <p className="text-xs font-mono text-[#FF8888]">{error}</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-[#101010] border border-[#1E1E1E] rounded-sm p-6">
          <CalendarDays className="w-10 h-10 text-[#444444] mx-auto" />
          <h3 className="font-serif text-lg text-[#F7F5F0]">No Reservations Found</h3>
          <p className="text-xs font-mono text-[#777777] max-w-sm mx-auto">
            There are currently no session bookings matching your filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-[#101010] border border-[#202020] rounded-sm overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#141414] text-[#888888] uppercase tracking-wider border-b border-[#202020]">
                <tr>
                  <th className="p-4">Reference & Client</th>
                  <th className="p-4">Package</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-[#141414] transition-colors group"
                  >
                    {/* Reference & Client */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#C9A86A] block">
                          {booking.booking_reference}
                        </span>
                        <span className="text-[#F7F5F0] font-sans font-medium block">
                          {booking.customer_name}
                        </span>
                        <span className="text-[11px] text-[#777777] block">
                          {booking.customer_email}
                        </span>
                      </div>
                    </td>

                    {/* Package */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="text-[#F7F5F0] font-serif block">
                          {booking.service_name || 'Commission Package'}
                        </span>
                        {booking.service_duration && (
                          <span className="text-[11px] text-[#777777] block">
                            {booking.service_duration} mins
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-4">
                      <span className="text-[#F7F5F0] block">
                        {booking.booking_date}
                      </span>
                    </td>

                    {/* Time Slot */}
                    <td className="p-4">
                      <span className="text-[#D4D0C5] block">
                        {booking.start_time} - {booking.end_time}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-4">
                      <span className="text-[#C9A86A] font-semibold block">
                        {booking.currency || 'EUR'} {Number(booking.price).toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {getStatusBadge(booking.status)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Quick Confirm if pending */}
                        {booking.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                            disabled={actionLoading}
                            title="Confirm Booking"
                            className="p-1.5 bg-[#14291B] hover:bg-[#1E3B27] border border-[#265A34] text-[#52D68A] rounded-sm transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Quick Decline if pending */}
                        {booking.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsDeclineModalOpen(true);
                            }}
                            disabled={actionLoading}
                            title="Decline Booking"
                            className="p-1.5 bg-[#291414] hover:bg-[#3B1E1E] border border-[#5A2626] text-[#D65252] rounded-sm transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reschedule Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setRescheduleDate(booking.booking_date);
                            setRescheduleTime(booking.start_time);
                            setIsRescheduleModalOpen(true);
                          }}
                          disabled={actionLoading || booking.status === 'cancelled' || booking.status === 'declined'}
                          title="Reschedule Session"
                          className="p-1.5 bg-[#181818] hover:bg-[#222222] border border-[#2C2C2C] text-[#AAAAAA] hover:text-[#C9A86A] rounded-sm transition-all disabled:opacity-30"
                        >
                          <CalendarRange className="w-3.5 h-3.5" />
                        </button>

                        {/* View Full Details Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsDetailModalOpen(true);
                          }}
                          title="View Details"
                          className="p-1.5 bg-[#181818] hover:bg-[#222222] border border-[#2C2C2C] text-[#AAAAAA] hover:text-[#F7F5F0] rounded-sm transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 1. BOOKING DETAIL MODAL                                       */}
      {/* ============================================================= */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-[#060606]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101010] border border-[#2A2A2A] rounded-sm max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1E1E1E] flex items-center justify-between bg-[#141414]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] block">
                  Reservation Detail
                </span>
                <h3 className="font-serif text-xl text-[#F7F5F0]">
                  {selectedBooking.booking_reference}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-[#777777] hover:text-[#F7F5F0] bg-[#181818] border border-[#282828] rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs font-mono overflow-y-auto max-h-[70vh]">
              <div className="flex justify-between items-center pb-4 border-b border-[#1E1E1E]">
                <span className="text-[#888888] uppercase">Status</span>
                {getStatusBadge(selectedBooking.status)}
              </div>

              {/* Client Card */}
              <div className="bg-[#141414] border border-[#222222] p-4 rounded-sm space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-[#C9A86A] block">
                  Client Information
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#888888]" />
                    <span className="text-sm font-sans text-[#F7F5F0] font-medium">
                      {selectedBooking.customer_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#888888]" />
                    <a
                      href={`mailto:${selectedBooking.customer_email}`}
                      className="text-[#C9A86A] hover:underline"
                    >
                      {selectedBooking.customer_email}
                    </a>
                  </div>
                  {selectedBooking.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#888888]" />
                      <a
                        href={`tel:${selectedBooking.customer_phone}`}
                        className="text-[#F7F5F0]"
                      >
                        {selectedBooking.customer_phone}
                      </a>
                    </div>
                  )}
                  {selectedBooking.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#888888]" />
                      <span className="text-[#BBBBBB]">{selectedBooking.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service & Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#141414] border border-[#222222] p-3.5 rounded-sm space-y-1">
                  <span className="text-[#888888] uppercase block text-[10px]">Package</span>
                  <span className="font-serif text-sm text-[#F7F5F0] block">
                    {selectedBooking.service_name || 'Commission'}
                  </span>
                  <span className="text-[#C9A86A] font-semibold block">
                    {selectedBooking.currency || 'EUR'} {Number(selectedBooking.price).toLocaleString()}
                  </span>
                </div>

                <div className="bg-[#141414] border border-[#222222] p-3.5 rounded-sm space-y-1">
                  <span className="text-[#888888] uppercase block text-[10px]">Schedule</span>
                  <span className="text-[#F7F5F0] font-medium block">
                    {selectedBooking.booking_date}
                  </span>
                  <span className="text-[#AAAAAA] block">
                    {selectedBooking.start_time} - {selectedBooking.end_time}
                  </span>
                </div>
              </div>

              {/* Creative Vision */}
              {selectedBooking.message && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase text-[#888888] block">
                    Client Vision / Instructions:
                  </span>
                  <p className="text-xs text-[#BBBBBB] bg-[#141414] border border-[#222222] p-3 rounded-sm italic font-sans leading-relaxed">
                    "{selectedBooking.message}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-6 border-t border-[#1E1E1E] bg-[#141414] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-mono uppercase text-[#888888] hover:text-[#F7F5F0]"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')}
                      className="px-4 py-2 bg-[#14291B] hover:bg-[#1E3B27] border border-[#265A34] text-[#52D68A] text-xs font-mono uppercase tracking-wider font-semibold rounded-sm transition-all"
                    >
                      Confirm Session
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setIsDeclineModalOpen(true);
                      }}
                      className="px-4 py-2 bg-[#291414] hover:bg-[#3B1E1E] border border-[#5A2626] text-[#D65252] text-xs font-mono uppercase tracking-wider rounded-sm transition-all"
                    >
                      Decline
                    </button>
                  </>
                )}

                {selectedBooking.status === 'confirmed' && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'completed')}
                      className="px-4 py-2 bg-[#141E29] hover:bg-[#1E2D3B] border border-[#263D5A] text-[#5295D6] text-xs font-mono uppercase tracking-wider font-semibold rounded-sm transition-all"
                    >
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelled')}
                      className="px-4 py-2 bg-[#291414] hover:bg-[#3B1E1E] border border-[#5A2626] text-[#D65252] text-xs font-mono uppercase tracking-wider rounded-sm transition-all"
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. DECLINE REASON MODAL                                       */}
      {/* ============================================================= */}
      {isDeclineModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-[#060606]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101010] border border-[#2A2A2A] rounded-sm max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D65252] block">
                Decline Booking Request
              </span>
              <h3 className="font-serif text-xl text-[#F7F5F0]">
                Decline {selectedBooking.booking_reference}?
              </h3>
              <p className="text-xs font-mono text-[#888888]">
                An automated polite notification will be dispatched to {selectedBooking.customer_email}.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] block">
                Reason / Note for Client (Optional)
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Prior travel commitment on this date, please consider booking for next week."
                className="w-full bg-[#141414] border border-[#252525] focus:border-[#C9A86A] text-[#F7F5F0] p-3 rounded-sm text-xs outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                className="px-4 py-2 text-xs font-mono uppercase text-[#888888] hover:text-[#F7F5F0]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(selectedBooking.id, 'declined', declineReason)}
                className="px-5 py-2 bg-[#D65252] hover:bg-[#E66262] text-[#080808] text-xs font-mono uppercase tracking-wider font-bold rounded-sm transition-all flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 3. RESCHEDULE MODAL                                           */}
      {/* ============================================================= */}
      {isRescheduleModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-[#060606]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101010] border border-[#2A2A2A] rounded-sm max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A] block">
                Reschedule Session
              </span>
              <h3 className="font-serif text-xl text-[#F7F5F0]">
                {selectedBooking.customer_name} ({selectedBooking.booking_reference})
              </h3>
              <p className="text-xs font-mono text-[#888888]">
                Current: {selectedBooking.booking_date} ({selectedBooking.start_time} - {selectedBooking.end_time})
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] block">
                  New Session Date *
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-[#141414] border border-[#252525] focus:border-[#C9A86A] text-[#F7F5F0] px-3.5 py-2.5 rounded-sm text-xs font-mono outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] block">
                  New Start Time (HH:MM) *
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-[#141414] border border-[#252525] focus:border-[#C9A86A] text-[#F7F5F0] px-3.5 py-2.5 rounded-sm text-xs font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1C1C]">
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-4 py-2 text-xs font-mono uppercase text-[#888888] hover:text-[#F7F5F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rescheduleDate || !rescheduleTime}
                onClick={handleReschedule}
                className="px-5 py-2 bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] text-xs font-mono uppercase tracking-wider font-bold rounded-sm transition-all flex items-center gap-2 disabled:opacity-40"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save New Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
