import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  isPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      isPasswordToggle = false,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const actualType = isPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wider text-[#A0A0A0]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#6F6F6F] pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={actualType}
            className={`w-full bg-[#121212] border text-[#F7F5F0] placeholder-[#555555] text-sm rounded-sm px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#C9A86A] focus:border-[#C9A86A] ${
              leftIcon ? 'pl-10' : ''
            } ${isPasswordToggle ? 'pr-10' : ''} ${
              error ? 'border-red-500/80 focus:ring-red-500/50 focus:border-red-500' : 'border-[#2A2A2A] hover:border-[#3E3E3E]'
            } ${className}`}
            {...props}
          />
          {isPasswordToggle && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 text-[#6F6F6F] hover:text-[#C9A86A] transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400 font-normal">{error}</p>}
        {!error && helperText && <p className="text-xs text-[#6F6F6F]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
