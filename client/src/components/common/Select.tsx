import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-[#2F2930] mb-1.5 font-display">
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full appearance-none rounded-xl border border-[#E5E1E4] bg-white px-3 py-2 pr-9 text-sm text-[#2F2930] transition duration-150 ease-in-out focus:border-[#714B67] focus:outline-none focus:ring-1 focus:ring-[#714B67] disabled:bg-[#F7F7F6] disabled:text-[#6F6A70] font-medium shadow-2xs cursor-pointer',
              error && 'border-[#B85C5C] focus:border-[#B85C5C] focus:ring-[#B85C5C]',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-[#2F2930] py-1 bg-white">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6F6A70]">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-[#B85C5C] font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-[#6F6A70]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
