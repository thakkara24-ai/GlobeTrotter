import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-[#2F2930] mb-1.5 font-display">
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6F6A70]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-[#E5E1E4] bg-white px-3 py-2 text-sm text-[#2F2930] placeholder-[#6F6A70]/60 transition duration-150 ease-in-out focus:border-[#714B67] focus:outline-none focus:ring-1 focus:ring-[#714B67] disabled:bg-[#F7F7F6] disabled:text-[#6F6A70] font-medium shadow-2xs',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-[#B85C5C] focus:border-[#B85C5C] focus:ring-[#B85C5C]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6F6A70]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-[#B85C5C] font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-[#6F6A70]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
