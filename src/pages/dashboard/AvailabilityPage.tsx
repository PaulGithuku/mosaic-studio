import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studioService } from '../../services/studioService';
import { AvailabilityDay } from '../../types/phase2';
import { AvailabilityGridSkeleton } from '../../components/ui/Skeletons';
import {
  Calendar,
  Clock,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Loader2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

const DAYS_CONFIG = [
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
  { day: 0, name: 'Sunday', short: 'Sun' },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

interface DayState {
  day_of_week: number;
  name: string;
  short: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
}

export const AvailabilityPage: React.FC = () => {
  const { photographer } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DayState[]>(() =>
    DAYS_CONFIG.map((d) => ({
      day_of_week: d.day,
      name: d.name,
      short: d.short,
      enabled: d.day >= 1 && d.day <= 5, // Mon-Fri default
      start_time: '09:00',
      end_time: '17:00',
    }))
  );

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await studioService.getAvailability();
      if (data && data.length > 0) {
        setSchedule(
          DAYS_CONFIG.map((d) => {
            const match = data.find((item) => item.day_of_week === d.day);
            return {
              day_of_week: d.day,
              name: d.name,
              short: d.short,
              enabled: match ? match.enabled : d.day >= 1 && d.day <= 5,
              start_time: match?.start_time ? match.start_time.substring(0, 5) : '09:00',
              end_time: match?.end_time ? match.end_time.substring(0, 5) : '17:00',
            };
          })
        );
      }
    } catch (err) {
      addToast('Failed to load studio schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleToggleDay = (day_of_week: number) => {
    setSchedule((prev) =>
      prev.map((d) => (d.day_of_week === day_of_week ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleTimeChange = (
    day_of_week: number,
    field: 'start_time' | 'end_time',
    val: string
  ) => {
    setSchedule((prev) =>
      prev.map((d) => (d.day_of_week === day_of_week ? { ...d, [field]: val } : d))
    );
  };

  // Presets
  const applyStandardPreset = () => {
    setSchedule(
      DAYS_CONFIG.map((d) => ({
        day_of_week: d.day,
        name: d.name,
        short: d.short,
        enabled: d.day >= 1 && d.day <= 5,
        start_time: '09:00',
        end_time: '17:00',
      }))
    );
    addToast('Applied "Standard Business Hours" (Mon-Fri 09:00 - 17:00)', 'info');
  };

  const applyExtendedPreset = () => {
    setSchedule(
      DAYS_CONFIG.map((d) => ({
        day_of_week: d.day,
        name: d.name,
        short: d.short,
        enabled: d.day >= 1 && d.day <= 6,
        start_time: '08:00',
        end_time: '20:00',
      }))
    );
    addToast('Applied "Extended Hours" (Mon-Sat 08:00 - 20:00)', 'info');
  };

  const applyWeekendPreset = () => {
    setSchedule(
      DAYS_CONFIG.map((d) => ({
        day_of_week: d.day,
        name: d.name,
        short: d.short,
        enabled: d.day === 0 || d.day === 6,
        start_time: '10:00',
        end_time: '18:00',
      }))
    );
    addToast('Applied "Weekend Commissions Only" (Sat-Sun 10:00 - 18:00)', 'info');
  };

  const handleSave = async () => {
    // Validate that enabled days have start_time < end_time
    for (const d of schedule) {
      if (d.enabled) {
        if (d.start_time >= d.end_time) {
          addToast(
            `Invalid hours for ${d.name}: start time (${d.start_time}) must be earlier than end time (${d.end_time}).`,
            'error'
          );
          return;
        }
      }
    }

    try {
      setSaving(true);
      const payload = schedule.map((d) => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        enabled: d.enabled,
      }));

      await studioService.saveAvailability(payload);
      addToast('Working hours & calendar schedule saved successfully', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save schedule';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeDaysCount = schedule.filter((d) => d.enabled).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1A1A1A] pb-6">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-[#F7F5F0] font-light">
            Studio Working Hours & Availability
          </h1>
          <p className="text-sm text-[#8E8E8E] mt-1">
            Configure your active shoot days, booking windows, and appointment session hours.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-widest font-semibold rounded-sm transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Hours...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Schedule</span>
            </>
          )}
        </button>
      </div>

      {/* Presets Bar */}
      <div className="bg-[#121212] border border-[#1F1F1F] p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#AAAAAA]">
          <Sliders className="w-3.5 h-3.5 text-[#C9A86A]" />
          <span>Quick Schedule Templates:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyStandardPreset}
            className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-[#E0E0E0] text-xs font-mono rounded-sm border border-[#2E2E2E] transition-colors"
          >
            Mon–Fri (09:00–17:00)
          </button>
          <button
            type="button"
            onClick={applyExtendedPreset}
            className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-[#E0E0E0] text-xs font-mono rounded-sm border border-[#2E2E2E] transition-colors"
          >
            Mon–Sat (08:00–20:00)
          </button>
          <button
            type="button"
            onClick={applyWeekendPreset}
            className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-[#E0E0E0] text-xs font-mono rounded-sm border border-[#2E2E2E] transition-colors"
          >
            Weekends Only
          </button>
        </div>
      </div>

      {/* Main Days Editor */}
      {loading ? (
        <AvailabilityGridSkeleton />
      ) : (
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-sm divide-y divide-[#1A1A1A]">
          {schedule.map((day) => {
            const hasError = day.enabled && day.start_time >= day.end_time;
            return (
              <div
                key={day.day_of_week}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  day.enabled ? 'bg-transparent' : 'bg-[#0E0E0E]/40 opacity-70'
                }`}
              >
                {/* Day Selector & Status */}
                <div className="flex items-center gap-4 min-w-[180px]">
                  <button
                    type="button"
                    onClick={() => handleToggleDay(day.day_of_week)}
                    className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${
                      day.enabled
                        ? 'bg-[#C9A86A] border-[#C9A86A] text-[#0B0B0B]'
                        : 'bg-[#181818] border-[#333333] text-transparent hover:border-[#555555]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        day.enabled ? 'text-[#F7F5F0]' : 'text-[#777777]'
                      }`}
                    >
                      {day.name}
                    </span>
                    <span className="block text-[11px] font-mono text-[#666666]">
                      {day.enabled ? 'Available for bookings' : 'Closed / Off'}
                    </span>
                  </div>
                </div>

                {/* Time Range Pickers */}
                {day.enabled ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#C9A86A]" />
                      <span className="text-xs font-mono text-[#888888]">From:</span>
                      <select
                        value={day.start_time}
                        onChange={(e) =>
                          handleTimeChange(day.day_of_week, 'start_time', e.target.value)
                        }
                        className="bg-[#181818] border border-[#2E2E2E] focus:border-[#C9A86A] text-[#F7F5F0] text-xs px-2.5 py-1.5 outline-none rounded-sm font-mono"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="text-[#555555] font-mono">—</span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#888888]">To:</span>
                      <select
                        value={day.end_time}
                        onChange={(e) =>
                          handleTimeChange(day.day_of_week, 'end_time', e.target.value)
                        }
                        className="bg-[#181818] border border-[#2E2E2E] focus:border-[#C9A86A] text-[#F7F5F0] text-xs px-2.5 py-1.5 outline-none rounded-sm font-mono"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {hasError && (
                      <span className="text-xs text-[#FF6666] font-mono flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Invalid interval</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-[#555555] italic">
                    Studio unavailable on this day
                  </div>
                )}

                {/* Day hours duration summary */}
                <div className="text-right hidden md:block min-w-[120px]">
                  {day.enabled && !hasError && (
                    <span className="text-xs font-mono text-[#C9A86A]">
                      {day.start_time} – {day.end_time}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Operating Schedule Summary Footer */}
      <div className="bg-[#121212] border border-[#1F1F1F] p-6 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#181818] border border-[#2B2B2B] flex items-center justify-center text-[#C9A86A]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-serif text-[#F7F5F0]">
              Active Studio Schedule ({activeDaysCount} days / week)
            </h4>
            <p className="text-xs text-[#777777] mt-0.5">
              Clients booking through your public profile will only be permitted to request slots during these operational windows.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-widest font-semibold rounded-sm transition-colors shrink-0 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Schedule</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
