import React, { useEffect, useState, useCallback } from 'react';
import { PortfolioImage, Category } from '../../types/phase2';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface PublicLightboxProps {
  images: PortfolioImage[];
  categories: Category[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  photographerName: string;
}

export const PublicLightbox: React.FC<PublicLightboxProps> = ({
  images,
  categories,
  currentIndex,
  onClose,
  onNavigate,
  photographerName,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentImage = images[currentIndex];

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setImageLoaded(false);
    setIsZoomed(false);
    const nextIdx = (currentIndex + 1) % images.length;
    onNavigate(nextIdx);
  }, [currentIndex, images.length, onNavigate]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setImageLoaded(false);
    setIsZoomed(false);
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    onNavigate(prevIdx);
  }, [currentIndex, images.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleNext, handlePrev, onClose]);

  if (!currentImage) return null;

  const categoryObj = categories.find((c) => c.id === currentImage.category_id);
  const categoryName = categoryObj ? categoryObj.name : currentImage.category_name || '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox Preview"
      className="fixed inset-0 z-50 bg-[#060606]/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200"
    >
      {/* Lightbox Top Navigation Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#1C1C1C] bg-[#0A0A0A]/80 z-20">
        <div className="flex items-center gap-3">
          <span className="font-serif text-sm text-[#F7F5F0] tracking-wider">
            {photographerName}
          </span>
          <span className="text-[#444444]">/</span>
          <span className="text-xs font-mono text-[#C9A86A]">
            {String(currentIndex + 1).padStart(2, '0')} of {String(images.length).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            aria-label={isZoomed ? 'Zoom Out' : 'Zoom In'}
            className="p-2 text-[#AAAAAA] hover:text-[#C9A86A] bg-[#141414] hover:bg-[#1E1E1E] border border-[#2B2B2B] rounded-sm transition-colors"
            title={isZoomed ? 'Actual Fit' : 'Full Detail'}
          >
            {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowInfo(!showInfo)}
            aria-label="Toggle Details"
            className={`p-2 border rounded-sm transition-colors ${
              showInfo
                ? 'bg-[#C9A86A] text-[#080808] border-[#C9A86A]'
                : 'text-[#AAAAAA] hover:text-[#C9A86A] bg-[#141414] border-[#2B2B2B]'
            }`}
            title="Toggle Details"
          >
            <Info className="w-4 h-4" />
          </button>

          <a
            href={currentImage.public_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            aria-label="View Full Resolution"
            className="p-2 text-[#AAAAAA] hover:text-[#C9A86A] bg-[#141414] hover:bg-[#1E1E1E] border border-[#2B2B2B] rounded-sm transition-colors"
            title="Open Full Resolution"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            aria-label="Close Lightbox"
            id="lightbox-close-btn"
            className="p-2 text-[#AAAAAA] hover:text-[#F7F5F0] bg-[#1A1A1A] hover:bg-[#282828] border border-[#333333] rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Image Stage */}
      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Navigation Arrow Left */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            aria-label="Previous photograph"
            className="absolute left-4 sm:left-8 z-30 p-3.5 bg-[#0E0E0E]/80 hover:bg-[#1A1A1A] text-[#D4D0C5] hover:text-[#C9A86A] border border-[#2E2E2E] rounded-sm transition-all duration-200 backdrop-blur-md hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Center Photograph Container */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ${
            isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#C9A86A]/30 border-t-[#C9A86A] rounded-full animate-spin" />
            </div>
          )}
          <img
            src={currentImage.public_url}
            alt={currentImage.title || `Photograph by ${photographerName}`}
            onLoad={() => setImageLoaded(true)}
            className={`max-h-[75vh] w-auto max-w-[90vw] object-contain rounded-sm border border-[#222222] shadow-2xl transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* Navigation Arrow Right */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            aria-label="Next photograph"
            className="absolute right-4 sm:right-8 z-30 p-3.5 bg-[#0E0E0E]/80 hover:bg-[#1A1A1A] text-[#D4D0C5] hover:text-[#C9A86A] border border-[#2E2E2E] rounded-sm transition-all duration-200 backdrop-blur-md hover:scale-105"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </main>

      {/* Bottom Metadata Bar */}
      {showInfo && (
        <footer className="px-6 py-4 bg-[#0A0A0A]/90 border-t border-[#1C1C1C] z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="font-serif text-base text-[#F7F5F0] font-normal">
                {currentImage.title || 'Untitled Photograph'}
              </h3>
              {categoryName && (
                <span className="px-2 py-0.5 bg-[#161616] border border-[#2A2A2A] text-[#C9A86A] text-[10px] font-mono rounded-sm">
                  {categoryName}
                </span>
              )}
              {currentImage.featured && (
                <span className="px-2 py-0.5 bg-[#C9A86A]/10 border border-[#C9A86A]/40 text-[#C9A86A] text-[10px] font-mono rounded-sm flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Featured
                </span>
              )}
            </div>
            {currentImage.description && (
              <p className="text-xs text-[#999999] max-w-2xl font-light leading-relaxed">
                {currentImage.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#666666] shrink-0">
            {currentImage.mime_type && (
              <span className="uppercase">{currentImage.mime_type.replace('image/', '')}</span>
            )}
            <span>•</span>
            <span>Use ← → Arrow Keys</span>
          </div>
        </footer>
      )}
    </div>
  );
};
