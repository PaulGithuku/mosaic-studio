import React, { useState, useEffect } from 'react';
import { Profile } from '../../types/auth';
import { Link } from 'react-router-dom';
import { Menu, X, Calendar, Camera } from 'lucide-react';

interface PublicHeaderProps {
  profile: Profile;
  onBookSession: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ profile, onBookSession }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#080808]/90 backdrop-blur-md border-b border-[#1C1C1C] py-3.5 shadow-2xl'
          : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between">
        {/* Brand / Photographer Studio Title */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-left group"
        >
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg sm:text-xl text-[#F7F5F0] tracking-tight group-hover:text-[#C9A86A] transition-colors">
              {profile.name}
            </span>
            <span className="text-[10px] font-mono text-[#C9A86A] uppercase px-1.5 py-0.5 bg-[#C9A86A]/10 border border-[#C9A86A]/30 rounded-sm">
              Studio
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-[#AAAAAA]">
          <button
            onClick={() => scrollToSection('about')}
            className="hover:text-[#F7F5F0] transition-colors"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection('portfolio')}
            className="hover:text-[#F7F5F0] transition-colors"
          >
            Portfolio
          </button>
          <button
            onClick={() => scrollToSection('services')}
            className="hover:text-[#F7F5F0] transition-colors"
          >
            Services
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="hover:text-[#F7F5F0] transition-colors"
          >
            Contact
          </button>
        </nav>

        {/* Desktop Action & Link to Portal */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-[11px] font-mono uppercase text-[#777777] hover:text-[#C9A86A] transition-colors px-2 py-1"
          >
            Studio Portal
          </Link>
          <button
            onClick={onBookSession}
            id="nav-book-session-btn"
            className="px-4 py-2 bg-[#C9A86A] hover:bg-[#D9B87A] text-[#080808] font-mono text-xs uppercase tracking-wider font-semibold rounded-sm transition-all duration-200 shadow-md flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Session</span>
          </button>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          className="md:hidden p-2 text-[#D4D0C5] bg-[#141414] border border-[#262626] rounded-sm"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0C0C0C] border-b border-[#222222] px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-mono uppercase tracking-wider text-[#CCCCCC]">
            <button
              onClick={() => scrollToSection('about')}
              className="text-left py-2 border-b border-[#181818] hover:text-[#C9A86A]"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('portfolio')}
              className="text-left py-2 border-b border-[#181818] hover:text-[#C9A86A]"
            >
              Portfolio
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="text-left py-2 border-b border-[#181818] hover:text-[#C9A86A]"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-left py-2 border-b border-[#181818] hover:text-[#C9A86A]"
            >
              Contact
            </button>
          </nav>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBookSession();
              }}
              className="w-full py-3 bg-[#C9A86A] text-[#080808] font-mono text-xs uppercase tracking-wider font-semibold rounded-sm flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Session</span>
            </button>

            <Link
              to="/login"
              className="text-center text-xs font-mono uppercase text-[#777777] hover:text-[#C9A86A] py-2"
            >
              Photographer Login / Portal →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
