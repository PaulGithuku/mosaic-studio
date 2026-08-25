import React from 'react';
import { Profile } from '../../types/auth';
import { Award, MapPin, Sparkles, CheckCircle2, User } from 'lucide-react';

interface PublicAboutProps {
  profile: Profile;
}

export const PublicAbout: React.FC<PublicAboutProps> = ({ profile }) => {
  return (
    <section id="about" className="py-20 lg:py-28 px-6 sm:px-10 lg:px-16 bg-[#0B0B0B] border-b border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Portrait Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative Frame */}
              <div className="absolute -top-3 -left-3 w-full h-full border border-[#C9A86A]/30 rounded-sm pointer-events-none" />
              
              <div className="aspect-[4/5] bg-[#141414] border border-[#262626] rounded-sm overflow-hidden relative shadow-2xl">
                {profile.profile_image_path ? (
                  <img
                    src={profile.profile_image_path}
                    alt={`Portrait of ${profile.name}`}
                    className="w-full h-full object-cover object-center filter grayscale contrast-[1.05] hover:grayscale-0 transition-all duration-700"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] text-[#444444]">
                    <User className="w-16 h-16 text-[#333333] mb-2" />
                    <span className="font-serif text-2xl text-[#C9A86A]">{profile.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B]/80 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating Experience Badge */}
                {profile.years_experience > 0 && (
                  <div className="absolute bottom-4 left-4 right-4 bg-[#0E0E0E]/90 backdrop-blur-md border border-[#2B2B2B] p-3 rounded-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#C9A86A]" />
                      <span className="text-xs font-mono text-[#D4D0C5]">Studio Experience</span>
                    </div>
                    <span className="font-mono text-sm text-[#C9A86A] font-semibold">
                      {profile.years_experience}+ Years
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Biography & Editorial Text Column */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <span className="text-[11px] uppercase font-mono tracking-widest text-[#C9A86A] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Artist Profile & Philosophy
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] font-light leading-tight">
                Capturing narrative, texture, and light with uncompromising intention.
              </h2>
            </div>

            {/* Biography Content */}
            <div className="space-y-4 text-sm sm:text-base text-[#AAAAAA] leading-relaxed font-light">
              {profile.bio ? (
                profile.bio.split('\n').filter(Boolean).map((paragraph, index) => (
                  <p key={index} className="text-[#C0BCB3]">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-[#C0BCB3]">
                  Dedicated to crafting authentic, evocative imagery for private commissions, editorial publications,
                  and distinguished commercial brands. Every session is tailored to unveil singular elegance and genuine human emotion.
                </p>
              )}
            </div>

            {/* Metadata Badges: Location & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {profile.location && (
                <div className="p-4 bg-[#121212] border border-[#222222] rounded-sm flex items-start gap-3">
                  <div className="p-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-sm text-[#C9A86A] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#777777] block">Base Studio</span>
                    <span className="text-xs sm:text-sm font-serif text-[#F7F5F0]">{profile.location}</span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-[#121212] border border-[#222222] rounded-sm flex items-start gap-3">
                <div className="p-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-sm text-[#C9A86A] shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#777777] block">Professional Practice</span>
                  <span className="text-xs sm:text-sm font-serif text-[#F7F5F0]">
                    {profile.years_experience > 0 ? `${profile.years_experience} Years Active` : 'Master Photographer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Specialties Badges */}
            {profile.specialties && profile.specialties.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#888888] block">
                  Core Disciplines & Specialties
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {profile.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1.5 bg-[#141414] border border-[#282828] text-[#D4D0C5] text-xs font-mono rounded-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#C9A86A]" />
                      <span>{specialty}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
