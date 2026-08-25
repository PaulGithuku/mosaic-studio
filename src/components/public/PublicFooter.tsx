import React from 'react';
import { Profile } from '../../types/auth';
import { ArrowUp, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PublicFooterProps {
  profile: Profile;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ profile }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] border-t border-[#161616] py-12 px-6 sm:px-10 lg:px-16 text-[#777777]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <span className="font-serif text-lg text-[#D4D0C5]">{profile.name}</span>
          <span className="hidden sm:inline text-[#333333]">|</span>
          <span className="text-xs font-mono">
            © {currentYear} {profile.name}. All photographic copyrights reserved.
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono">
          <Link
            to="/login"
            className="hover:text-[#C9A86A] transition-colors"
          >
            Powered by MOSAIC STUDIO
          </Link>

          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="p-2.5 bg-[#101010] hover:bg-[#1C1C1C] border border-[#222222] text-[#AAAAAA] hover:text-[#C9A86A] rounded-sm transition-colors flex items-center gap-1.5"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase">Top</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
