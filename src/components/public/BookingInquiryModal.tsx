import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service, AvailabilityDay } from '../../types/phase2';
import { Profile } from '../../types/auth';
import { TimeSlot } from '../../types/booking';
import { bookingClientService } from '../../services/bookingClientService';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';

interface BookingInquiryModalProps {
  service: Service | null;
  services?: Service[];
  profile: Profile;
  availability: AvailabilityDay[];
  onClose: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type BookingStep = 'service_date' | 'time' | 'details' | 'review' | 'success';

export const BookingInquiryModal: React.FC<BookingInquiryModalProps> = ({
  service: initialService,
  services = [],
  profile,
  availability,
  onClose,
}) => {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState<BookingStep>('service_date');
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || services[0] || null);

  // Calendar state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD

  // Time slot state
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Client details state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBookingReference, setCreatedBookingReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Set default initial date to next available operating day
  useEffect(() => {
    if (selectedDate) return;
    const now = new Date();
    // Look ahead up to 14 days for first operating day
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const dayOfWeek = d.getDay();
      const avail = availability.find((a) => a.day_of_week === dayOfWeek);
      if (avail && avail.enabled) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
        break;
      }
    }
  }, [availability, selectedDate]);

  // Fetch slots whenever selectedDate or selectedService changes
  useEffect(() => {
    if (!selectedDate || !selectedService || !profile.slug) return;

    let isMounted = true;
    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        setSlotsError(null);
        setSelectedSlot(null);

        const res = await bookingClientService.getAvailableSlots(
          profile.slug,
          selectedService.id,
          selectedDate
        );

        if (isMounted) {
          setSlots(res.slots || []);
          // Auto-select first available slot if any
          const firstAvailable = res.slots.find((s) => s.available);
          if (firstAvailable) {
            setSelectedSlot(firstAvailable);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setSlotsError(err.response?.data?.error || err.message || 'Failed to load slots');
          setSlots([]);
        }
      } finally {
        if (isMounted) {
          setSlotsLoading(false);
        }
      }
    };

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedService, profile.slug]);

  if (!selectedService) return null;

  // Calendar Helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isPastDate = (day: number) => {
    const check = new Date(currentYear, currentMonth, day);
    check.setHours(23, 59, 59, 999);
    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    return check < todayCheck;
  };

  const isOperatingDay = (day: number) => {
    const check = new Date(currentYear, currentMonth, day);
    const dayOfWeek = check.getDay();
    const config = availability.find((a) => a.day_of_week === dayOfWeek);
    return Boolean(config && config.enabled);
  };

  const handleDateClick = (day: number) => {
    if (isPastDate(day) || !isOperatingDay(day)) return;
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Form Validation
  const validateDetails = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim() || customerName.trim().length < 2) {
      errs.customerName = 'Please enter your full name (at least 2 characters).';
    }
    if (!customerEmail.trim() || !customerEmail.includes('@') || !customerEmail.includes('.')) {
      errs.customerEmail = 'Please provide a valid email address for confirmation.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const response = await bookingClientService.createBooking({
        photographer_slug: profile.slug,
        service_id: selectedService.id,
        booking_date: selectedDate,
        start_time: selectedSlot.start_time,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: customerPhone.trim() || undefined,
        location: location.trim() || undefined,
        message: message.trim() || undefined,
      });

      setCreatedBookingReference(response.booking.booking_reference);
      setStep('success');
    } catch (err: any) {
      console.error('Booking submission error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'An error occurred while creating your reservation.';
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    if (!createdBookingReference) return;
    navigator.clipboard.writeText(createdBookingReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#060606]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-[#0E0E0E] border border-[#2B2B2B] rounded-sm max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#1C1C1C] flex items-center justify-between bg-[#121212] shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Studio Commission Reservation
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-[#F7F5F0] font-light">
              {profile.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-[#777777] hover:text-[#F7F5F0] bg-[#181818] border border-[#2A2A2A] rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicator (when not success) */}
        {step !== 'success' && (
          <div className="bg-[#141414] border-b border-[#1E1E1E] px-6 py-2.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#777777] shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'service_date' ? 'bg-[#C9A86A] text-[#080808] font-bold' : 'bg-[#222222] text-[#888888]'
              }`}>1</span>
              <span className={step === 'service_date' ? 'text-[#F7F5F0]' : ''}>Date & Package</span>
            </div>
            <span className="text-[#333333]">/</span>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'time' ? 'bg-[#C9A86A] text-[#080808] font-bold' : 'bg-[#222222] text-[#888888]'
              }`}>2</span>
              <span className={step === 'time' ? 'text-[#F7F5F0]' : ''}>Time Slot</span>
            </div>
            <span className="text-[#333333]">/</span>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'details' ? 'bg-[#C9A86A] text-[#080808] font-bold' : 'bg-[#222222] text-[#888888]'
              }`}>3</span>
              <span className={step === 'details' ? 'text-[#F7F5F0]' : ''}>Your Info</span>
            </div>
            <span className="text-[#333333]">/</span>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'review' ? 'bg-[#C9A86A] text-[#080808] font-bold' : 'bg-[#222222] text-[#888888]'
              }`}>4</span>
              <span className={step === 'review' ? 'text-[#F7F5F0]' : ''}>Confirm</span>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-sm text-[#CCCCCC]">
          {/* ============================================================= */}
          {/* STEP 1: SELECT PACKAGE & DATE                                */}
          {/* ============================================================= */}
          {step === 'service_date' && (
            <div className="space-y-6">
              {/* Package Selector */}
              {services.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] block">
                    1. Select Photography Commission Package
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedService(s)}
                        className={`p-3.5 rounded-sm text-left border transition-all ${
                          selectedService.id === s.id
                            ? 'bg-[#181611] border-[#C9A86A] text-[#F7F5F0] shadow-sm'
                            : 'bg-[#121212] border-[#222222] text-[#A0A0A0] hover:border-[#333333]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-serif font-medium text-sm text-[#F7F5F0]">
                            {s.name}
                          </span>
                          <span className="text-xs font-mono font-semibold text-[#C9A86A]">
                            {s.currency} {s.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-[#888888]">
                          <Clock className="w-3 h-3 text-[#C9A86A]" />
                          <span>{formatDuration(s.duration_minutes)}</span>
                          {s.category && <span>• {s.category}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Single Selected Package Highlight */}
              {services.length <= 1 && (
                <div className="bg-[#141414] border border-[#242424] p-4 rounded-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A]">
                      Selected Commission
                    </span>
                    <h3 className="font-serif text-lg text-[#F7F5F0]">{selectedService.name}</h3>
                    <p className="text-xs font-mono text-[#888888]">
                      Duration: {formatDuration(selectedService.duration_minutes)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono uppercase text-[#777777] block">Rate</span>
                    <span className="text-xl font-serif text-[#C9A86A] font-medium">
                      {selectedService.currency} {selectedService.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Calendar Date Picker */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#C9A86A]" />
                    2. Select Appointment Date
                  </label>
                  <span className="text-[11px] font-mono text-[#C9A86A]">
                    {selectedDate ? `Selected: ${selectedDate}` : 'Pick a date'}
                  </span>
                </div>

                <div className="bg-[#121212] border border-[#222222] rounded-sm p-4 space-y-4">
                  {/* Calendar Month Navigation */}
                  <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
                    <span className="font-serif text-base text-[#F7F5F0] tracking-wide">
                      {MONTH_NAMES[currentMonth]} {currentYear}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        aria-label="Previous month"
                        className="p-1.5 text-[#888888] hover:text-[#F7F5F0] bg-[#181818] border border-[#2A2A2A] rounded-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        aria-label="Next month"
                        className="p-1.5 text-[#888888] hover:text-[#F7F5F0] bg-[#181818] border border-[#2A2A2A] rounded-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-[#777777] font-semibold">
                    {DAY_NAMES.map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono">
                    {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-9" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const day = idx + 1;
                      const yyyy = currentYear;
                      const mm = String(currentMonth + 1).padStart(2, '0');
                      const dd = String(day).padStart(2, '0');
                      const dateStr = `${yyyy}-${mm}-${dd}`;

                      const isPast = isPastDate(day);
                      const isOperating = isOperatingDay(day);
                      const isSelected = selectedDate === dateStr;

                      const isDisabled = isPast || !isOperating;

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleDateClick(day)}
                          className={`h-9 rounded-sm flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#C9A86A] text-[#080808] font-bold shadow-md'
                              : isDisabled
                              ? 'text-[#444444] bg-[#0E0E0E] cursor-not-allowed line-through opacity-40'
                              : 'text-[#D4D0C5] bg-[#161616] hover:bg-[#202020] hover:text-[#F7F5F0] border border-[#222222]'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1C1C1C] text-[10px] font-mono text-[#777777]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#161616] border border-[#333333] inline-block" />
                      <span>Available Day</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A86A] inline-block" />
                      <span>Selected Date</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#0E0E0E] border border-[#222222] opacity-40 inline-block" />
                      <span>Unavailable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 2: SELECT TIME SLOT                                     */}
          {/* ============================================================= */}
          {step === 'time' && (
            <div className="space-y-6">
              <div className="bg-[#141414] border border-[#242424] p-4 rounded-sm flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#C9A86A] block">
                    Session & Scheduled Date
                  </span>
                  <span className="font-serif text-base text-[#F7F5F0]">
                    {selectedService.name}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono text-[#F7F5F0] block">{selectedDate}</span>
                  <span className="text-[11px] font-mono text-[#888888]">
                    Duration: {formatDuration(selectedService.duration_minutes)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C9A86A]" />
                    Available Time Slots for {selectedDate}
                  </span>
                  <span className="text-[11px] text-[#C9A86A]">
                    {selectedSlot ? `Selected: ${selectedSlot.start_time} - ${selectedSlot.end_time}` : 'Pick a time'}
                  </span>
                </label>

                {slotsLoading && (
                  <div className="py-12 text-center space-y-2 bg-[#121212] border border-[#222222] rounded-sm">
                    <Loader2 className="w-6 h-6 text-[#C9A86A] animate-spin mx-auto" />
                    <p className="text-xs font-mono text-[#888888]">
                      Calculating real-time slot availability...
                    </p>
                  </div>
                )}

                {!slotsLoading && slotsError && (
                  <div className="p-4 bg-[#2A1414] border border-[#552222] rounded-sm text-xs font-mono text-[#FF8888] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#FF6666] mt-0.5" />
                    <div>
                      <p className="font-semibold">{slotsError}</p>
                      <p className="text-[11px] text-[#DD7777] mt-1">
                        Please go back and select a different date.
                      </p>
                    </div>
                  </div>
                )}

                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <div className="py-10 text-center space-y-2 bg-[#121212] border border-[#222222] rounded-sm p-6">
                    <Clock className="w-8 h-8 text-[#555555] mx-auto" />
                    <h4 className="font-serif text-base text-[#F7F5F0]">No Available Slots</h4>
                    <p className="text-xs font-mono text-[#888888] max-w-sm mx-auto">
                      All studio hours for this date are fully reserved or outside operating parameters. Please select an alternate date.
                    </p>
                  </div>
                )}

                {!slotsLoading && !slotsError && slots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {slots.map((slot, idx) => {
                      const isSelected =
                        selectedSlot?.start_time === slot.start_time &&
                        selectedSlot?.end_time === slot.end_time;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-sm text-center border transition-all ${
                            isSelected
                              ? 'bg-[#C9A86A] border-[#C9A86A] text-[#080808] font-bold shadow-md'
                              : !slot.available
                              ? 'bg-[#101010] border-[#1E1E1E] text-[#555555] cursor-not-allowed opacity-40 line-through'
                              : 'bg-[#141414] border-[#252525] text-[#D4D0C5] hover:border-[#383838] hover:bg-[#1A1A1A]'
                          }`}
                        >
                          <div className="font-mono text-xs tracking-wider">
                            {slot.start_time} - {slot.end_time}
                          </div>
                          {!slot.available && (
                            <span className="text-[9px] uppercase tracking-widest font-mono text-[#888888] block mt-1">
                              {slot.reason || 'Unavailable'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 3: CLIENT CONTACT DETAILS                               */}
          {/* ============================================================= */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="bg-[#141414] border border-[#242424] p-4 rounded-sm flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[#888888]">Reservation:</span>{' '}
                  <span className="text-[#F7F5F0] font-medium">{selectedService.name}</span>
                </div>
                <div>
                  <span className="text-[#C9A86A]">
                    {selectedDate} • {selectedSlot?.start_time} - {selectedSlot?.end_time}
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C9A86A]" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full bg-[#121212] border border-[#282828] focus:border-[#C9A86A] text-[#F7F5F0] px-3.5 py-2.5 rounded-sm text-sm outline-none transition-colors"
                  />
                  {formErrors.customerName && (
                    <p className="text-xs font-mono text-[#FF7777]">{formErrors.customerName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#C9A86A]" /> Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="eleanor@example.com"
                      className="w-full bg-[#121212] border border-[#282828] focus:border-[#C9A86A] text-[#F7F5F0] px-3.5 py-2.5 rounded-sm text-sm outline-none transition-colors"
                    />
                    {formErrors.customerEmail && (
                      <p className="text-xs font-mono text-[#FF7777]">{formErrors.customerEmail}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C9A86A]" /> Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-[#121212] border border-[#282828] focus:border-[#C9A86A] text-[#F7F5F0] px-3.5 py-2.5 rounded-sm text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C9A86A]" /> Shoot Location / Venue (Optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Studio, outdoor address, or client premises"
                    className="w-full bg-[#121212] border border-[#282828] focus:border-[#C9A86A] text-[#F7F5F0] px-3.5 py-2.5 rounded-sm text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#C9A86A]" /> Creative Vision / Special Requests
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mood, lighting preferences, outfit details, or specific artistic requirements..."
                    className="w-full bg-[#121212] border border-[#282828] focus:border-[#C9A86A] text-[#F7F5F0] p-3 rounded-sm text-sm outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 4: REVIEW SUMMARY & TRUSTED SERVER PRICE VERIFICATION   */}
          {/* ============================================================= */}
          {step === 'review' && (
            <div className="space-y-5">
              <div className="bg-[#141414] border border-[#282828] rounded-sm p-5 space-y-4">
                <div className="border-b border-[#202020] pb-3 flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A]">
                    Reservation Summary
                  </span>
                  <span className="text-xs font-mono text-[#888888]">Step 4 of 4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-[#888888] uppercase block">Photographer</span>
                    <span className="text-sm font-serif text-[#F7F5F0] block">{profile.name}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#888888] uppercase block">Package</span>
                    <span className="text-sm font-serif text-[#F7F5F0] block">{selectedService.name}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#888888] uppercase block">Appointment Date</span>
                    <span className="text-[#F7F5F0] font-medium block">{selectedDate}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#888888] uppercase block">Reserved Slot</span>
                    <span className="text-[#C9A86A] font-semibold block">
                      {selectedSlot?.start_time} – {selectedSlot?.end_time} ({formatDuration(selectedService.duration_minutes)})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#888888] uppercase block">Client Name</span>
                    <span className="text-[#F7F5F0] block">{customerName}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#888888] uppercase block">Client Email</span>
                    <span className="text-[#F7F5F0] block">{customerEmail}</span>
                  </div>

                  {customerPhone && (
                    <div className="space-y-1">
                      <span className="text-[#888888] uppercase block">Phone</span>
                      <span className="text-[#F7F5F0] block">{customerPhone}</span>
                    </div>
                  )}

                  {location && (
                    <div className="space-y-1">
                      <span className="text-[#888888] uppercase block">Location</span>
                      <span className="text-[#F7F5F0] block">{location}</span>
                    </div>
                  )}
                </div>

                {message && (
                  <div className="pt-2 border-t border-[#1E1E1E]">
                    <span className="text-[10px] font-mono uppercase text-[#888888] block mb-1">
                      Creative Note:
                    </span>
                    <p className="text-xs text-[#AAAAAA] italic font-light bg-[#0E0E0E] p-2.5 rounded-sm border border-[#1A1A1A]">
                      "{message}"
                    </p>
                  </div>
                )}

                {/* Trusted Price Total */}
                <div className="pt-4 border-t border-[#222222] flex justify-between items-center bg-[#121212] -mx-5 -mb-5 p-5 rounded-b-sm">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#888888] block">
                      Investment Total (Server Verified)
                    </span>
                    <span className="text-xs text-[#666666]">Due upon studio invoice agreement</span>
                  </div>
                  <span className="font-serif text-2xl text-[#C9A86A] font-bold">
                    {selectedService.currency} {selectedService.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {submitError && (
                <div className="p-4 bg-[#2A1414] border border-[#552222] rounded-sm text-xs font-mono text-[#FF8888] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#FF6666] mt-0.5" />
                  <div>
                    <p className="font-semibold">{submitError}</p>
                    <p className="text-[11px] text-[#DD7777] mt-1">
                      If this time was just reserved by someone else, please click Back to choose another slot.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-[11px] text-[#777777] bg-[#0E0E0E] p-3 rounded-sm border border-[#1A1A1A]">
                <ShieldCheck className="w-4 h-4 text-[#C9A86A] shrink-0 mt-0.5" />
                <p>
                  By submitting this reservation, you confirm your availability for the selected time. The photographer will review and confirm your session. You will receive an email confirmation.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 5: SUCCESS STATE                                         */}
          {/* ============================================================= */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#14291B] border border-[#265A34] flex items-center justify-center mx-auto text-[#52D68A]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#52D68A]">
                  Reservation Successfully Placed
                </span>
                <h3 className="font-serif text-2xl text-[#F7F5F0]">
                  Your Session is Booked!
                </h3>
                <p className="text-xs font-mono text-[#AAAAAA] leading-relaxed">
                  We have dispatched an email confirmation to <span className="text-[#C9A86A]">{customerEmail}</span> with your reservation summary.
                </p>
              </div>

              {/* Reference Box */}
              {createdBookingReference && (
                <div className="bg-[#141414] border border-[#282828] p-5 rounded-sm max-w-md mx-auto space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#888888] block">
                    Booking Reference Code
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono text-2xl tracking-widest font-bold text-[#C9A86A]">
                      {createdBookingReference}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReference}
                      className="p-1.5 text-[#888888] hover:text-[#F7F5F0] bg-[#1E1E1E] border border-[#333333] rounded-sm transition-colors"
                      title="Copy Reference"
                    >
                      {copied ? <Check className="w-4 h-4 text-[#52D68A]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-[#666666]">
                    Keep this reference code to track or view your session confirmation.
                  </p>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                {createdBookingReference && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/booking/success/${createdBookingReference}`);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] text-xs font-mono uppercase tracking-widest font-bold rounded-sm transition-all"
                  >
                    View Official Confirmation Page
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-[#181818] hover:bg-[#222222] border border-[#333333] text-[#F7F5F0] text-xs font-mono uppercase tracking-widest rounded-sm transition-all"
                >
                  Close & Return to Studio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer (when not success) */}
        {step !== 'success' && (
          <div className="p-4 sm:p-6 border-t border-[#1C1C1C] bg-[#121212] flex items-center justify-between shrink-0">
            {step === 'service_date' ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-[#888888] hover:text-[#F7F5F0]"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (step === 'time') setStep('service_date');
                  else if (step === 'details') setStep('time');
                  else if (step === 'review') setStep('details');
                }}
                className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-[#A0A0A0] hover:text-[#F7F5F0] bg-[#181818] border border-[#282828] rounded-sm flex items-center gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            <div>
              {step === 'service_date' && (
                <button
                  type="button"
                  disabled={!selectedDate}
                  onClick={() => setStep('time')}
                  className={`px-6 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold rounded-sm flex items-center gap-1.5 transition-all ${
                    selectedDate
                      ? 'bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] shadow-md'
                      : 'bg-[#222222] text-[#666666] cursor-not-allowed'
                  }`}
                >
                  <span>Select Time</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === 'time' && (
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep('details')}
                  className={`px-6 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold rounded-sm flex items-center gap-1.5 transition-all ${
                    selectedSlot
                      ? 'bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] shadow-md'
                      : 'bg-[#222222] text-[#666666] cursor-not-allowed'
                  }`}
                >
                  <span>Enter Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === 'details' && (
                <button
                  type="button"
                  onClick={() => {
                    if (validateDetails()) {
                      setStep('review');
                    }
                  }}
                  className="px-6 py-2.5 bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] text-xs font-mono uppercase tracking-wider font-semibold rounded-sm flex items-center gap-1.5 transition-all shadow-md"
                >
                  <span>Review Booking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === 'review' && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmBooking}
                  className="px-6 py-2.5 bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] text-xs font-mono uppercase tracking-wider font-bold rounded-sm flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Book Session</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
