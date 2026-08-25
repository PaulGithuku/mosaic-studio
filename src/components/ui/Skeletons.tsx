import React from 'react';

export const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#1A1A1A] rounded-sm ${className}`} />
);

export const DashboardOverviewSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-[#121212] border border-[#222222] p-8 rounded-sm space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2.5">
            <Shimmer className="h-4 w-40" />
            <Shimmer className="h-8 w-72" />
            <Shimmer className="h-4 w-96 max-w-full" />
          </div>
          <Shimmer className="h-10 w-32 hidden sm:block" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#121212] border border-[#1F1F1F] p-5 rounded-sm space-y-4">
            <div className="flex justify-between items-center">
              <Shimmer className="w-8 h-8 rounded-sm" />
              <Shimmer className="h-3 w-16" />
            </div>
            <div className="space-y-2">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-7 w-20" />
            </div>
            <Shimmer className="h-3 w-32 pt-2" />
          </div>
        ))}
      </div>

      {/* Analytics & Checklist Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#121212] border border-[#1F1F1F] p-6 rounded-sm space-y-4">
          <div className="flex justify-between">
            <Shimmer className="h-5 w-48" />
            <Shimmer className="h-4 w-24" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="flex items-center gap-3">
                  <Shimmer className="w-5 h-5 rounded-full" />
                  <Shimmer className="h-4 w-48" />
                </div>
                <Shimmer className="h-6 w-20 rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#1F1F1F] p-6 rounded-sm space-y-4">
          <Shimmer className="h-5 w-36" />
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <Shimmer key={i} className="h-11 w-full rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PortfolioGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="bg-[#121212] border border-[#1F1F1F] rounded-sm overflow-hidden flex flex-col">
          <div className="aspect-[4/5] bg-[#171717]" />
          <div className="p-3.5 space-y-2.5">
            <Shimmer className="h-4 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
            <div className="pt-2 border-t border-[#1C1C1C] flex justify-between">
              <Shimmer className="h-3 w-8" />
              <Shimmer className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ServicesGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-[#121212] border border-[#1F1F1F] p-6 rounded-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <Shimmer className="h-5 w-40" />
              <Shimmer className="h-5 w-16" />
            </div>
            <Shimmer className="h-8 w-28" />
            <Shimmer className="h-3 w-full" />
            <Shimmer className="h-3 w-4/5" />
          </div>
          <div className="pt-4 border-t border-[#1C1C1C] flex justify-between">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-7 w-24 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const BookingsTableSkeleton: React.FC = () => {
  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-sm overflow-hidden animate-pulse">
      <div className="p-4 border-b border-[#1A1A1A] flex justify-between">
        <Shimmer className="h-4 w-36" />
        <Shimmer className="h-4 w-20" />
      </div>
      <div className="divide-y divide-[#1A1A1A]">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-start gap-4">
              <Shimmer className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-2">
                <Shimmer className="h-4 w-44" />
                <Shimmer className="h-3 w-56" />
                <Shimmer className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-center">
              <Shimmer className="h-6 w-24 rounded-sm" />
              <Shimmer className="h-8 w-20 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AvailabilityGridSkeleton: React.FC = () => {
  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-sm p-6 space-y-4 animate-pulse">
      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
        <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#161616] border border-[#222222] rounded-sm gap-4">
          <div className="flex items-center gap-3">
            <Shimmer className="w-5 h-5 rounded" />
            <Shimmer className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-3">
            <Shimmer className="h-8 w-24 rounded-sm" />
            <span className="text-[#333333] font-mono">—</span>
            <Shimmer className="h-8 w-24 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProfileFormSkeleton: React.FC = () => {
  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-sm p-6 sm:p-8 space-y-6 animate-pulse">
      <div className="flex items-center gap-5 pb-6 border-b border-[#1A1A1A]">
        <Shimmer className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <Shimmer className="h-5 w-44" />
          <Shimmer className="h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Shimmer className="h-3 w-28" />
        <Shimmer className="h-28 w-full" />
      </div>
      <div className="flex justify-end">
        <Shimmer className="h-10 w-36 rounded-sm" />
      </div>
    </div>
  );
};

export const PublicProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080808] text-[#F7F5F0] animate-pulse selection:bg-[#C9A86A]">
      {/* Header */}
      <div className="h-20 border-b border-[#1F1F1F] px-8 flex items-center justify-between">
        <Shimmer className="h-6 w-32" />
        <div className="flex gap-4">
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-8 w-28 rounded-sm" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="min-h-[75vh] flex flex-col justify-center items-center text-center p-8 space-y-6">
        <Shimmer className="w-24 h-24 rounded-full border border-[#222222]" />
        <Shimmer className="h-10 w-80 max-w-full" />
        <Shimmer className="h-4 w-96 max-w-full" />
        <div className="flex gap-3">
          <Shimmer className="h-10 w-36 rounded-sm" />
          <Shimmer className="h-10 w-36 rounded-sm" />
        </div>
      </div>
    </div>
  );
};
