import React from 'react';
import { Service } from '../../types/phase2';
import { Sparkles, Clock, Calendar, ArrowRight, Check } from 'lucide-react';

interface PublicServicesProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export const PublicServices: React.FC<PublicServicesProps> = ({ services, onSelectService }) => {
  if (!services || services.length === 0) {
    return null;
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (hours > 0) {
      return `${hours} hr${hours > 1 ? 's' : ''}${rem > 0 ? ` ${rem}m` : ''}`;
    }
    return `${minutes} mins`;
  };

  return (
    <section id="services" className="py-20 lg:py-28 px-6 sm:px-10 lg:px-16 bg-[#0B0B0B] border-b border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#181818]">
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-mono tracking-widest text-[#C9A86A] flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Offerings & Packages
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] font-light">
              Services & Commission Rates
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-[#888888] max-w-md">
            Transparent bespoke rates, full commercial licensing options, and high-craft turnaround.
          </p>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className={`relative bg-[#111111] border rounded-sm p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl ${
                service.featured
                  ? 'border-[#C9A86A]/70 shadow-lg shadow-[#C9A86A]/5 bg-gradient-to-b from-[#161410] to-[#111111]'
                  : 'border-[#222222] hover:border-[#383838]'
              }`}
            >
              {service.featured && (
                <div className="absolute -top-3 left-6">
                  <span className="px-3 py-1 bg-[#C9A86A] text-[#080808] text-[10px] font-mono uppercase tracking-widest font-bold rounded-sm shadow-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Signature Package
                  </span>
                </div>
              )}

              <div className="space-y-6">
                {/* Service Header */}
                <div className="space-y-2">
                  {service.category && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A]">
                      {service.category}
                    </span>
                  )}
                  <h3 className="font-serif text-2xl text-[#F7F5F0] font-light">
                    {service.name}
                  </h3>
                </div>

                {/* Price & Duration */}
                <div className="p-4 bg-[#161616] border border-[#242424] rounded-sm space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-[#777777] uppercase">{service.currency}</span>
                    <span className="font-serif text-3xl text-[#C9A86A] font-normal">
                      {service.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#999999] pt-1">
                    <Clock className="w-3.5 h-3.5 text-[#C9A86A]" />
                    <span>Estimated Duration: {formatDuration(service.duration_minutes)}</span>
                  </div>
                </div>

                {/* Description / Scope */}
                {service.description && (
                  <p className="text-xs sm:text-sm text-[#AAAAAA] font-light leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button
                  onClick={() => onSelectService(service)}
                  id={`book-service-${service.id}`}
                  className={`w-full py-3.5 px-4 font-mono text-xs uppercase tracking-wider rounded-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    service.featured
                      ? 'bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] font-semibold shadow-lg shadow-[#C9A86A]/20'
                      : 'bg-[#1A1A1A] hover:bg-[#252525] text-[#F7F5F0] hover:text-[#C9A86A] border border-[#2D2D2D]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Inquire / Reserve Session</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
