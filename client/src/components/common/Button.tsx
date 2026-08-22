import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const variants = {
    primary:
      'bg-[#714B67] hover:bg-[#5A3A52] text-white shadow-2xs hover:shadow-xs focus-visible:ring-[#714B67]',
    secondary:
      'bg-[#F4EEF3] hover:bg-[#EAE1E8] text-[#714B67] border border-[#E5E1E4] focus-visible:ring-[#714B67]',
    accent:
      'bg-[#017E84] hover:bg-[#016368] text-white shadow-2xs hover:shadow-xs focus-visible:ring-[#017E84]',
    outline:
      'border border-[#E5E1E4] hover:border-[#714B67] hover:bg-[#F4EEF3]/60 text-[#2F2930] bg-white focus-visible:ring-[#714B67]',
    danger:
      'bg-[#B85C5C] hover:bg-[#9E4A4A] text-white shadow-2xs hover:shadow-xs focus-visible:ring-[#B85C5C]',
    ghost:
      'text-[#6F6A70] hover:text-[#714B67] hover:bg-[#F4EEF3] focus-visible:ring-[#714B67]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5 font-bold',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
