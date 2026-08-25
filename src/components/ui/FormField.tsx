import React, { ReactNode } from 'react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-medium uppercase tracking-wider text-[#A0A0A0] flex items-center justify-between">
          <span>{label}</span>
          {required && <span className="text-[#C9A86A] text-xs">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-400 font-normal">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#6F6F6F]">{helperText}</p>}
    </div>
  );
};
