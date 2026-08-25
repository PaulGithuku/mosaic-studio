import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { ButtonVariant, ButtonSize } from '../../types/ui';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C9A86A]/50 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap active:scale-[0.98]';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 rounded-sm gap-1.5 h-8',
      md: 'text-sm px-5 py-2.5 rounded-sm gap-2 h-10',
      lg: 'text-base px-7 py-3.5 rounded-sm gap-2.5 h-12',
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[#0B0B0B] text-[#F7F5F0] border border-[#333333] hover:bg-[#181818] hover:border-[#C9A86A]/50 shadow-sm',
      secondary:
        'bg-[#EFEDE8] text-[#111111] border border-[#DDDBD6] hover:bg-[#E5E2DC] hover:border-[#CCCCCC]',
      champagne:
        'bg-[#C9A86A] text-[#0B0B0B] font-semibold border border-[#B89758] hover:bg-[#D4B375] hover:shadow-md shadow-sm',
      outline:
        'bg-transparent text-[#F7F5F0] border border-[#DDDBD6]/30 hover:border-[#C9A86A] hover:text-[#C9A86A] hover:bg-[#141414]/50',
      ghost:
        'bg-transparent text-[#A0A0A0] hover:text-[#F7F5F0] hover:bg-[#1A1A1A]/60',
      danger:
        'bg-red-950/40 text-red-300 border border-red-800/50 hover:bg-red-900/60 hover:text-white',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
