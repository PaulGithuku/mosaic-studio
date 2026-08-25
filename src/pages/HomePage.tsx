import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import {
  Camera,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F7F5F0] flex flex-col selection:bg-[#C9A86A] selection:text-black">
      <Navbar />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#2B2B2B] text-[#C9A86A] text-xs font-medium uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Photography-First Booking Platform</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#F7F5F0] max-w-4xl mx-auto leading-[1.1]">
            The photography is the product.
            <span className="block italic text-[#C9A86A] mt-2 font-serif font-light">
              The booking should be effortless.
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-[#A0A0A0] max-w-2xl mx-auto leading-relaxed">
            MOSAIC STUDIO is an editorial appointments and business-management platform designed specifically for portrait, wedding, fashion, and commercial photographers.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button
                  variant="champagne"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Enter Studio Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    variant="champagne"
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Launch Your Studio Space
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Photographer Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Core Pillars Grid */}
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#1C1C1C]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#101010] border border-[#222222] rounded-sm flex flex-col">
              <div className="w-10 h-10 rounded-sm bg-[#161616] border border-[#2E2E2E] flex items-center justify-center text-[#C9A86A] mb-4">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl text-[#F7F5F0] font-medium">Editorial Visual Focus</h3>
              <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
                Designed to make your photography look stunning, cinematic, and central. Never look like a generic administrative utility.
              </p>
            </div>

            <div className="p-6 bg-[#101010] border border-[#222222] rounded-sm flex flex-col">
              <div className="w-10 h-10 rounded-sm bg-[#161616] border border-[#2E2E2E] flex items-center justify-center text-[#C9A86A] mb-4">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl text-[#F7F5F0] font-medium">Seamless Client Scheduling</h3>
              <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
                Frictionless booking flow that lets clients select services, pick slots, and confirm appointments without mandatory account creation.
              </p>
            </div>

            <div className="p-6 bg-[#101010] border border-[#222222] rounded-sm flex flex-col">
              <div className="w-10 h-10 rounded-sm bg-[#161616] border border-[#2E2E2E] flex items-center justify-center text-[#C9A86A] mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl text-[#F7F5F0] font-medium">Commercial Security</h3>
              <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
                JWT authenticated, bcrypt secured, strict multi-tenant isolation, and backend double-booking validation safeguards.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#1C1C1C] py-8 bg-[#090909]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6F6F6F]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#C9A86A]" />
            <span className="font-serif text-[#F7F5F0]">MOSAIC STUDIO</span>
            <span>— Premium Photography Booking Architecture</span>
          </div>
          <div>Phase 1 Foundation Operational</div>
        </div>
      </footer>
    </div>
  );
};
