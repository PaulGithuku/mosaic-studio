import React from 'react';
import { AvailabilityDay } from '../../types/phase2';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface PublicAvailabilityProps {
  availability: AvailabilityDay[];
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PublicAvailability: React.FC<PublicAvailabilityProps> = ({ availability }) => {
  const activeDays = availability.filter((d) => d.enabled);

  if (activeDays.length === 0) {
    return null;
  }

  return (
    <section id="availability" className="py-16 px-6 sm:px-10 lg:px-16 bg-[#090909] border-b border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#121212] border border-[#222222] rounded-sm p-8 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A] flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Standard Operating Hours
              </span>
              <h3 className="font-serif text-2xl text-[#F7F5F0] font-light">Studio & On-Location Availability</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#888888]">
              <Clock className="w-3.5 h-3.5 text-[#C9A86A]" />
              <span>Available for scheduled bookings</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {activeDays.map((day) => (
              <div
                key={day.day_of_week}
                className="p-3.5 bg-[#171717] border border-[#262626] rounded-sm flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm text-[#F7F5F0]">{DAY_NAMES[day.day_of_week]}</span>
                  <CheckCircle2 className="w-3 h-3 text-[#C9A86A]" />
                </div>
                <div className="text-[11px] font-mono text-[#AAAAAA]">
                  {day.start_time} — {day.end_time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
