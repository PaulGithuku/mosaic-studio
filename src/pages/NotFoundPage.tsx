import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Camera, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F7F5F0] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-sm bg-[#141414] border border-[#2B2B2B] flex items-center justify-center text-[#C9A86A] mb-6">
        <Camera className="w-6 h-6" />
      </div>
      <span className="text-xs font-mono text-[#C9A86A] uppercase tracking-widest">404 Error</span>
      <h1 className="font-serif text-3xl sm:text-4xl text-[#F7F5F0] mt-2 mb-3">Page Not Found</h1>
      <p className="text-xs sm:text-sm text-[#A0A0A0] max-w-md mb-8">
        The requested photography space, page, or resource is unavailable or has moved.
      </p>
      <Link to="/">
        <Button variant="champagne" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Mosaic Studio
        </Button>
      </Link>
    </div>
  );
};
