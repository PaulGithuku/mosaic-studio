import React, { ReactNode } from 'react';

export interface SectionContainerProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}) => {
  return (
    <section className={`w-full mb-8 sm:mb-12 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-6 border-b border-[#222222]">
          <div>
            {title && <h2 className="font-serif text-2xl sm:text-3xl text-[#F7F5F0] tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
