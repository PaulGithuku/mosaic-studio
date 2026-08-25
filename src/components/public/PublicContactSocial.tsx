import React from 'react';
import { Profile } from '../../types/auth';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Share2,
} from 'lucide-react';

interface PublicContactSocialProps {
  profile: Profile;
  onOpenBooking: () => void;
}

export const PublicContactSocial: React.FC<PublicContactSocialProps> = ({ profile, onOpenBooking }) => {
  // Format social link helpers
  const instagramUrl = profile.instagram
    ? profile.instagram.startsWith('http')
      ? profile.instagram
      : `https://instagram.com/${profile.instagram.replace('@', '')}`
    : null;

  const facebookUrl = profile.facebook
    ? profile.facebook.startsWith('http')
      ? profile.facebook
      : `https://facebook.com/${profile.facebook}`
    : null;

  const tiktokUrl = profile.tiktok
    ? profile.tiktok.startsWith('http')
      ? profile.tiktok
      : `https://tiktok.com/@${profile.tiktok.replace('@', '')}`
    : null;

  const whatsappClean = profile.whatsapp ? profile.whatsapp.replace(/[^0-9]/g, '') : null;
  const whatsappUrl = whatsappClean ? `https://wa.me/${whatsappClean}` : null;

  const websiteUrl = profile.website
    ? profile.website.startsWith('http')
      ? profile.website
      : `https://${profile.website}`
    : null;

  const hasSocials = Boolean(
    instagramUrl || facebookUrl || tiktokUrl || whatsappUrl || websiteUrl
  );

  return (
    <section id="contact" className="py-20 lg:py-28 px-6 sm:px-10 lg:px-16 bg-[#080808]">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Direct Inquiries */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-mono tracking-widest text-[#C9A86A] flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Inquiries & Commissions
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] font-light">
                Let's create something enduring.
              </h2>
            </div>
            <p className="text-sm text-[#AAAAAA] leading-relaxed font-light">
              Accepting private commissions, editorial assignments, and commercial campaign inquiries. Contact the studio directly to discuss concept art, availability, and production requirements.
            </p>

            <div className="pt-4">
              <button
                onClick={onOpenBooking}
                className="px-6 py-3.5 bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] font-mono text-xs uppercase tracking-widest font-semibold rounded-sm transition-all duration-200 shadow-xl flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Initiate Studio Inquiry</span>
              </button>
            </div>
          </div>

          {/* Right Column: Contact Details & Verified Socials */}
          <div className="lg:col-span-6 space-y-8">
            {/* Contact Channels */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#777777] block">
                Direct Channels
              </span>
              <div className="space-y-3">
                {/* Email (Always available) */}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="p-4 bg-[#111111] hover:bg-[#181818] border border-[#222222] hover:border-[#333333] rounded-sm flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#1A1A1A] border border-[#2C2C2C] text-[#C9A86A] rounded-sm">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#777777] block">Studio Email</span>
                        <span className="text-sm font-mono text-[#F7F5F0] group-hover:text-[#C9A86A] transition-colors">
                          {profile.email}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#555555] group-hover:text-[#C9A86A] transition-colors" />
                  </a>
                )}

                {/* Phone (Only if configured) */}
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="p-4 bg-[#111111] hover:bg-[#181818] border border-[#222222] hover:border-[#333333] rounded-sm flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#1A1A1A] border border-[#2C2C2C] text-[#C9A86A] rounded-sm">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#777777] block">Studio Phone</span>
                        <span className="text-sm font-mono text-[#F7F5F0] group-hover:text-[#C9A86A] transition-colors">
                          {profile.phone}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#555555] group-hover:text-[#C9A86A] transition-colors" />
                  </a>
                )}

                {/* Location (Only if configured) */}
                {profile.location && (
                  <div className="p-4 bg-[#111111] border border-[#222222] rounded-sm flex items-center gap-3">
                    <div className="p-2 bg-[#1A1A1A] border border-[#2C2C2C] text-[#C9A86A] rounded-sm">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#777777] block">Studio Location</span>
                      <span className="text-sm font-serif text-[#F7F5F0]">{profile.location}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Channels (Strictly only render configured fields) */}
            {hasSocials && (
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#777777] block">
                  Social & Web Presences
                </span>
                <div className="flex flex-wrap gap-3">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#141414] hover:bg-[#1D1D1D] text-[#D4D0C5] hover:text-[#C9A86A] border border-[#262626] hover:border-[#383838] rounded-sm text-xs font-mono flex items-center gap-2 transition-all duration-200"
                    >
                      <Instagram className="w-4 h-4 text-[#C9A86A]" />
                      <span>Instagram</span>
                    </a>
                  )}

                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#141414] hover:bg-[#1D1D1D] text-[#D4D0C5] hover:text-[#C9A86A] border border-[#262626] hover:border-[#383838] rounded-sm text-xs font-mono flex items-center gap-2 transition-all duration-200"
                    >
                      <Facebook className="w-4 h-4 text-[#C9A86A]" />
                      <span>Facebook</span>
                    </a>
                  )}

                  {tiktokUrl && (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#141414] hover:bg-[#1D1D1D] text-[#D4D0C5] hover:text-[#C9A86A] border border-[#262626] hover:border-[#383838] rounded-sm text-xs font-mono flex items-center gap-2 transition-all duration-200"
                    >
                      <Share2 className="w-4 h-4 text-[#C9A86A]" />
                      <span>TikTok</span>
                    </a>
                  )}

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#141414] hover:bg-[#1D1D1D] text-[#D4D0C5] hover:text-[#55D888] border border-[#262626] hover:border-[#383838] rounded-sm text-xs font-mono flex items-center gap-2 transition-all duration-200"
                    >
                      <MessageSquare className="w-4 h-4 text-[#55D888]" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#141414] hover:bg-[#1D1D1D] text-[#D4D0C5] hover:text-[#C9A86A] border border-[#262626] hover:border-[#383838] rounded-sm text-xs font-mono flex items-center gap-2 transition-all duration-200"
                    >
                      <Globe className="w-4 h-4 text-[#C9A86A]" />
                      <span>Studio Website</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
