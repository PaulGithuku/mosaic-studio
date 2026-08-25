import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 text-[#C9A86A] ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin`} />
      {label && <p className="text-xs uppercase tracking-widest text-[#A0A0A0] font-medium">{label}</p>}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-[#1E1E1E] rounded-sm ${className}`} />;
};

export const PageLoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading Mosaic Studio...',
}) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-[#2A2A2A] border-t-[#C9A86A] animate-spin mb-4" />
      <h3 className="font-serif text-lg text-[#F7F5F0] tracking-wide">{message}</h3>
      <p className="text-xs text-[#6F6F6F] mt-1 uppercase tracking-widest">Editorial Photography Platform</p>
    </div>
  );
};
