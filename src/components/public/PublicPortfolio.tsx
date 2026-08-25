import React, { useState } from 'react';
import { PortfolioImage, Category } from '../../types/phase2';
import { Maximize2, Sparkles, Image as ImageIcon, Filter } from 'lucide-react';

interface PublicPortfolioProps {
  portfolio: PortfolioImage[];
  categories: Category[];
  photographerName: string;
  onOpenLightbox: (index: number) => void;
}

export const PublicPortfolio: React.FC<PublicPortfolioProps> = ({
  portfolio,
  categories,
  photographerName,
  onOpenLightbox,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredImages = portfolio.filter((img) => {
    if (selectedCategory === 'all') return true;
    return img.category_id === selectedCategory;
  });

  return (
    <section id="portfolio" className="py-20 lg:py-28 px-6 sm:px-10 lg:px-16 bg-[#080808] border-b border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Portfolio Section Header & Categories Filter */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#181818]">
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-mono tracking-widest text-[#C9A86A] flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Selected Archive
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] font-light">
              Editorial Portfolio
            </h2>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-all duration-200 shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-[#C9A86A] text-[#080808] font-semibold shadow-lg shadow-[#C9A86A]/10'
                    : 'bg-[#121212] text-[#888888] hover:text-[#F7F5F0] border border-[#222222] hover:border-[#333333]'
                }`}
              >
                All Works ({portfolio.length})
              </button>
              {categories.map((cat) => {
                const count = portfolio.filter((img) => img.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-all duration-200 shrink-0 ${
                      selectedCategory === cat.id
                        ? 'bg-[#C9A86A] text-[#080808] font-semibold shadow-lg shadow-[#C9A86A]/10'
                        : 'bg-[#121212] text-[#888888] hover:text-[#F7F5F0] border border-[#222222] hover:border-[#333333]'
                    }`}
                  >
                    {cat.name} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredImages.length === 0 ? (
          <div className="py-24 text-center bg-[#0E0E0E] border border-[#1E1E1E] rounded-sm p-8 max-w-lg mx-auto space-y-3">
            <ImageIcon className="w-10 h-10 text-[#444444] mx-auto" />
            <h3 className="font-serif text-lg text-[#D4D0C5]">No Photographs in this Collection</h3>
            <p className="text-xs font-mono text-[#777777]">
              The photographer has not published any images in this category yet.
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="mt-3 px-4 py-2 bg-[#181818] border border-[#2A2A2A] text-xs font-mono text-[#C9A86A] hover:bg-[#222222] rounded-sm transition-colors inline-block"
              >
                View All Works
              </button>
            )}
          </div>
        ) : (
          /* Editorial Masonry/Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => {
              // Find global index in portfolio array for lightbox
              const globalIndex = portfolio.findIndex((p) => p.id === image.id);
              const cat = categories.find((c) => c.id === image.category_id);

              return (
                <figure
                  key={image.id}
                  onClick={() => onOpenLightbox(globalIndex >= 0 ? globalIndex : 0)}
                  className="group relative aspect-[4/5] bg-[#111111] border border-[#202020] hover:border-[#C9A86A]/50 rounded-sm overflow-hidden cursor-pointer transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-black/60 m-0"
                >
                  <img
                    src={image.public_url}
                    alt={image.title ? `${image.title} — Photography by ${photographerName}` : `Editorial photography by ${photographerName}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Featured Badge */}
                  {image.featured && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-1 bg-[#080808]/80 backdrop-blur-md border border-[#C9A86A]/40 text-[#C9A86A] text-[10px] font-mono uppercase tracking-wider rounded-sm flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Featured
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay with Metadata */}
                  <figcaption className="absolute inset-0 bg-gradient-to-t from-[#060606]/90 via-[#060606]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end">
                    {cat && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A] mb-1">
                        {cat.name}
                      </span>
                    )}
                    <h3 className="font-serif text-base sm:text-lg text-[#F7F5F0] font-normal leading-snug">
                      {image.title || 'Untitled Work'}
                    </h3>
                    {image.description && (
                      <p className="text-xs text-[#AAAAAA] line-clamp-2 mt-1 font-light">
                        {image.description}
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-[#2B2B2B] flex items-center justify-between text-[#C9A86A] text-xs font-mono">
                      <span>Explore High-Res</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
