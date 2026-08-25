import React from 'react';
import { Profile } from '../../types/auth';
import { PortfolioImage } from '../../types/phase2';
import { MapPin, ArrowDown, Calendar, Sparkles, Eye } from 'lucide-react';

interface PublicHeroProps {
  profile: Profile;
  heroImage?: PortfolioImage | null;
  onBookSession: () => void;
}

export const PublicHero: React.FC<PublicHeroProps> = ({ profile, heroImage, onBookSession }) => {
  const fallbackBg =
    heroImage?.public_url ||
    profile.profile_image_path ||
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=2000&q=85';

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[90vh] lg:min-h-[95vh] flex items-end justify-start overflow-hidden bg-[#080808]">
      {/* Background Dominant Photograph with Vignette & Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          src={fallbackBg}
          alt={`Featured photographic work by ${profile.name}`}
          className="w-full h-full object-cover object-center brightness-[0.65] contrast-[1.05] scale-[1.02] transition-transform duration-1000 ease-out"
          loading="eager"
          decoding="async"
        />
        {/* Cinematic Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-black/30" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#080808]/30 to-[#080808]/80 pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pb-16 sm:pb-24 pt-32">
        <div className="max-w-3xl space-y-6">
          {/* Location & Specialty Tag */}
          <div className="flex flex-wrap items-center gap-3">
            {profile.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0E0E0E]/80 backdrop-blur-md border border-[#2B2B2B] text-[#C9A86A] text-xs font-mono tracking-wider rounded-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile.location}</span>
              </span>
            )}
            {profile.specialties && profile.specialties.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0E0E0E]/80 backdrop-blur-md border border-[#2B2B2B] text-[#D4D0C5] text-xs font-mono tracking-wider rounded-sm">
                <Sparkles className="w-3 h-3 text-[#C9A86A]" />
                <span>{profile.specialties[0]}</span>
              </span>
            )}
          </div>

          {/* Photographer Name (Grand Display Typography) */}
          <div className="space-y-3">
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#F7F5F0] font-light tracking-tight leading-[1.05] drop-shadow-lg">
              {profile.name}
            </h1>
            {profile.specialties && profile.specialties.length > 1 && (
              <p className="font-serif text-lg sm:text-2xl text-[#C9A86A] font-light tracking-wide italic opacity-95">
                {profile.specialties.join(' · ')}
              </p>
            )}
          </div>

          {/* Tagline / Subtitle */}
          <p className="text-sm sm:text-base text-[#D4D0C5] font-light leading-relaxed max-w-2xl drop-shadow-md">
            {profile.bio
              ? profile.bio.slice(0, 180) + (profile.bio.length > 180 ? '...' : '')
              : 'Editorial, commercial, and fine art photography captured with timeless aesthetic precision.'}
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onBookSession}
              id="hero-book-session-btn"
              className="px-6 py-3.5 bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] font-mono text-xs uppercase tracking-widest font-semibold rounded-sm transition-all duration-200 shadow-xl hover:shadow-[#C9A86A]/20 hover:scale-[1.02] flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Session</span>
            </button>

            <button
              onClick={() => scrollToSection('portfolio')}
              id="hero-view-portfolio-btn"
              className="px-6 py-3.5 bg-[#141414]/90 hover:bg-[#1E1E1E] text-[#F7F5F0] hover:text-[#C9A86A] border border-[#2B2B2B] hover:border-[#3D3D3D] font-mono text-xs uppercase tracking-widest rounded-sm transition-all duration-200 backdrop-blur-md flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-[#C9A86A]" />
              <span>View Portfolio</span>
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute right-6 sm:right-12 bottom-12 hidden md:flex flex-col items-center gap-2 text-[#777777]">
          <span className="text-[10px] font-mono uppercase tracking-widest rotate-90 origin-right translate-x-4 mb-4">
            Scroll to explore
          </span>
          <ArrowDown className="w-4 h-4 text-[#C9A86A] animate-bounce" />
        </div>
      </div>
    </section>
  );
};
