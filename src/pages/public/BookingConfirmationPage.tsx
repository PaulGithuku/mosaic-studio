import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Booking } from '../../types/booking';
import { bookingClientService } from '../../services/bookingClientService';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  User,
  Copy,
  Check,
  Printer,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const BookingConfirmationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reference) {
      setError('No booking reference provided in URL.');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bookingClientService.getBookingByReference(reference);
        setBooking(data);
      } catch (err: any) {
        console.error('Error loading booking confirmation:', err);
        setError(err.response?.data?.error || 'Booking confirmation not found or invalid reference.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [reference]);

  const handleCopy = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#F7F5F0] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#C9A86A] animate-spin mx-auto" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#888888]">
            Retrieving Booking Confirmation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#F7F5F0] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#121212] border border-[#242424] p-8 rounded-sm text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#2A1414] border border-[#5A2424] flex items-center justify-center mx-auto text-[#FF6666]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-[#F7F5F0]">Reservation Not Found</h2>
            <p className="text-xs font-mono text-[#888888]">{error}</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1C1C1C] hover:bg-[#282828] border border-[#333333] text-[#F7F5F0] text-xs font-mono uppercase tracking-widest rounded-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Studio Directory
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-3 py-1 bg-[#14291B] border border-[#265A34] text-[#52D68A] text-[10px] font-mono uppercase tracking-widest rounded-sm">
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-[#292414] border border-[#5A4B26] text-[#D6B952] text-[10px] font-mono uppercase tracking-widest rounded-sm">
            Pending Review
          </span>
        );
      case 'declined':
        return (
          <span className="px-3 py-1 bg-[#291414] border border-[#5A2626] text-[#D65252] text-[10px] font-mono uppercase tracking-widest rounded-sm">
            Declined
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 bg-[#141E29] border border-[#263D5A] text-[#5295D6] text-[10px] font-mono uppercase tracking-widest rounded-sm">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-[#1A1A1A] border border-[#333333] text-[#AAAAAA] text-[10px] font-mono uppercase tracking-widest rounded-sm">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F7F5F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Actions Bar (hidden when printing) */}
        <div className="print:hidden flex items-center justify-between">
          <Link
            to={booking.photographer_slug ? `/photographer/${booking.photographer_slug}` : '/'}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#888888] hover:text-[#C9A86A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Photographer Studio</span>
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#141414] hover:bg-[#202020] border border-[#2A2A2A] text-xs font-mono uppercase tracking-wider text-[#CCCCCC] rounded-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>

        {/* Main Confirmation Card */}
        <div className="bg-[#101010] border border-[#242424] rounded-sm overflow-hidden shadow-2xl">
          {/* Header Banner */}
          <div className="p-8 sm:p-10 border-b border-[#1E1E1E] bg-[#141414] text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#14291B] border border-[#265A34] flex items-center justify-center mx-auto text-[#52D68A]">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A] flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                MOSAIC Studio Official Reservation
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-light text-[#F7F5F0]">
                Photography Session Reserved
              </h1>
              <p className="text-xs font-mono text-[#888888] max-w-md mx-auto">
                Thank you for your reservation. A confirmation record has been registered for your session with{' '}
                <strong className="text-[#F7F5F0]">{booking.photographer_name || 'the photographer'}</strong>.
              </p>
            </div>

            {/* Reference Badge */}
            <div className="inline-flex items-center gap-3 bg-[#0A0A0A] border border-[#262626] px-4 py-2 rounded-sm mt-2">
              <span className="text-[11px] font-mono uppercase text-[#888888]">Reference:</span>
              <span className="font-mono text-base font-bold text-[#C9A86A] tracking-wider">
                {booking.booking_reference}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 text-[#777777] hover:text-[#F7F5F0] transition-colors"
                title="Copy reference code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#52D68A]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8 sm:p-10 space-y-8">
            {/* Status & Service Row */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-[#1E1E1E]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#888888] block mb-1">
                  Session Status
                </span>
                {getStatusBadge(booking.status)}
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#888888] block mb-1">
                  Commission Rate
                </span>
                <span className="font-serif text-2xl text-[#C9A86A] font-medium">
                  {booking.currency || 'EUR'} {Number(booking.price).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Grid Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[#888888] uppercase block">Photographer / Studio</span>
                <span className="text-base font-serif text-[#F7F5F0] block">
                  {booking.photographer_name || 'Studio Member'}
                </span>
                {booking.photographer_slug && (
                  <Link
                    to={`/photographer/${booking.photographer_slug}`}
                    className="text-[11px] text-[#C9A86A] hover:underline inline-flex items-center gap-1 mt-0.5 print:hidden"
                  >
                    <span>View Studio Profile</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[#888888] uppercase block">Commission Package</span>
                <span className="text-base font-serif text-[#F7F5F0] block">
                  {booking.service_name || 'Photography Commission'}
                </span>
                {booking.service_duration && (
                  <span className="text-[11px] text-[#888888] block">
                    Duration: {booking.service_duration} minutes
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[#888888] uppercase block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C9A86A]" />
                  Scheduled Date
                </span>
                <span className="text-sm text-[#F7F5F0] font-medium block">
                  {booking.booking_date}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#888888] uppercase block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C9A86A]" />
                  Session Time
                </span>
                <span className="text-sm text-[#C9A86A] font-semibold block">
                  {booking.start_time} – {booking.end_time}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#888888] uppercase block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C9A86A]" />
                  Client Name
                </span>
                <span className="text-sm text-[#F7F5F0] block">
                  {booking.customer_name}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#888888] uppercase block flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C9A86A]" />
                  Contact Email
                </span>
                <span className="text-sm text-[#F7F5F0] block">
                  {booking.customer_email}
                </span>
              </div>

              {booking.customer_phone && (
                <div className="space-y-1">
                  <span className="text-[#888888] uppercase block flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C9A86A]" />
                    Phone Number
                  </span>
                  <span className="text-sm text-[#F7F5F0] block">
                    {booking.customer_phone}
                  </span>
                </div>
              )}

              {booking.location && (
                <div className="space-y-1">
                  <span className="text-[#888888] uppercase block flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C9A86A]" />
                    Location
                  </span>
                  <span className="text-sm text-[#F7F5F0] block">
                    {booking.location}
                  </span>
                </div>
              )}
            </div>

            {booking.message && (
              <div className="p-4 bg-[#141414] border border-[#222222] rounded-sm space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#888888] block">
                  Creative Notes & Instructions:
                </span>
                <p className="text-xs text-[#BBBBBB] italic font-light">
                  "{booking.message}"
                </p>
              </div>
            )}

            {/* Security & Studio Policies */}
            <div className="p-4 bg-[#0D0D0D] border border-[#1E1E1E] rounded-sm flex items-start gap-3 text-xs text-[#777777]">
              <ShieldCheck className="w-4 h-4 text-[#C9A86A] shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="text-[#AAAAAA] font-medium font-mono text-[11px]">
                  Studio Terms & Rescheduling Policy
                </p>
                <p>
                  To reschedule or make amendments to your session, please contact the photographer directly referencing your reservation code <strong className="text-[#C9A86A]">{booking.booking_reference}</strong> at least 48 hours prior to your scheduled time.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-[#0B0B0B] border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#666666] gap-3">
            <div>
              <span>Created on {new Date(booking.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>MOSAIC STUDIO PLATFORM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
