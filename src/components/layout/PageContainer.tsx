import React, { ReactNode } from 'react';

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
}) => {
  const maxWMap = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <main className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 ${maxWMap[maxWidth]} ${className}`}>
      {children}
    </main>
  );
};
