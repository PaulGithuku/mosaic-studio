import { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'champagne' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface BaseProps {
  className?: string;
  children?: ReactNode;
}
