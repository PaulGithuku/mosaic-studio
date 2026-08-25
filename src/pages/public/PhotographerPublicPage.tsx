import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studioService } from '../../services/studioService';
import { Category, PortfolioImage, Service, AvailabilityDay } from '../../types/phase2';
import { Profile } from '../../types/auth';
import { SEOHead } from '../../components/public/SEOHead';
import { PublicHeader } from '../../components/public/PublicHeader';
import { PublicHero } from '../../components/public/PublicHero';
import { PublicAbout } from '../../components/public/PublicAbout';
import { PublicPortfolio } from '../../components/public/PublicPortfolio';
import { PublicLightbox } from '../../components/public/PublicLightbox';
import { PublicServices } from '../../components/public/PublicServices';
import { PublicAvailability } from '../../components/public/PublicAvailability';
import { PublicContactSocial } from '../../components/public/PublicContactSocial';
import { PublicFooter } from '../../components/public/PublicFooter';
import { BookingInquiryModal } from '../../components/public/BookingInquiryModal';
import { PublicProfileSkeleton } from '../../components/ui/Skeletons';
import { Camera, Loader2, Compass } from 'lucide-react';

export const PhotographerPublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [notFound, setNotFound] = useState(false);

  // Interaction State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<Service | null>(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    const fetchStudio = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await studioService.getPublicStudio(slug);

        if (isMounted) {
          if (!data || !data.profile) {
            setNotFound(true);
          } else {
            setProfile(data.profile);
            setCategories(data.categories || []);
            setPortfolio(data.portfolio || []);
            setServices(data.services || []);
            setAvailability(data.availability || []);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudio();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Loading Screen
  if (loading) {
    return <PublicProfileSkeleton />;
  }

  // Not Found Screen
  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#F7F5F0] flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full text-center bg-[#0F0F0F] border border-[#222222] p-10 rounded-sm shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-full bg-[#181818] border border-[#333333] flex items-center justify-center mx-auto text-[#C9A86A]">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A]">
              404 — Studio Archive
            </span>
            <h1 className="font-serif text-3xl text-[#F7F5F0] font-light">Studio Not Found</h1>
            <p className="text-xs font-mono text-[#888888] leading-relaxed">
              The studio portfolio matching <span className="text-[#C9A86A]">@{slug}</span> is either inactive or does not exist.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="px-6 py-3 bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] text-xs font-mono uppercase tracking-widest font-semibold rounded-sm inline-block transition-all shadow-md"
            >
              Return to MOSAIC Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const featuredImage = portfolio.find((img) => img.featured) || portfolio[0] || null;

  const handleOpenBooking = () => {
    // If services exist, default to the first featured or active service
    const defaultService = services.find((s) => s.featured) || services[0] || null;
    if (defaultService) {
      setSelectedServiceForBooking(defaultService);
    } else {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F7F5F0] selection:bg-[#C9A86A] selection:text-[#080808] overflow-x-hidden font-sans">
      {/* 1. SEO & Metadata Integration */}
      <SEOHead profile={profile} />

      {/* 2. Top Sticky Navigation */}
      <PublicHeader profile={profile} onBookSession={handleOpenBooking} />

      {/* 3. Main Editorial Content Sections */}
      <main>
        {/* Cinematic Hero */}
        <PublicHero
          profile={profile}
          heroImage={featuredImage}
          onBookSession={handleOpenBooking}
        />

        {/* About & Biography */}
        <PublicAbout profile={profile} />

        {/* Portfolio Showcase with Lightbox */}
        <PublicPortfolio
          portfolio={portfolio}
          categories={categories}
          photographerName={profile.name}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
        />

        {/* Services & Packages */}
        {services.length > 0 && (
          <PublicServices
            services={services}
            onSelectService={(service) => setSelectedServiceForBooking(service)}
          />
        )}

        {/* Operating Hours / Availability */}
        {availability.length > 0 && <PublicAvailability availability={availability} />}

        {/* Direct Contact & Verified Social Channels */}
        <PublicContactSocial profile={profile} onOpenBooking={handleOpenBooking} />
      </main>

      {/* 4. Footer */}
      <PublicFooter profile={profile} />

      {/* 5. Lightbox Modal */}
      {lightboxIndex !== null && portfolio.length > 0 && (
        <PublicLightbox
          images={portfolio}
          categories={categories}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          photographerName={profile.name}
        />
      )}

      {/* 6. Booking Inquiry & Phase 4 Commission Modal */}
      {selectedServiceForBooking && (
        <BookingInquiryModal
          service={selectedServiceForBooking}
          services={services}
          profile={profile}
          availability={availability}
          onClose={() => setSelectedServiceForBooking(null)}
        />
      )}
    </div>
  );
};
