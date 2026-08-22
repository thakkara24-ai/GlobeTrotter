import React from 'react';
import { cn } from '../../utils/cn';

export interface InitialsAvatarProps {
  name: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PALETTE = [
  'bg-[#714B67]', // Primary Purple
  'bg-[#017E84]', // Secondary Teal
  'bg-[#5A3A52]', // Dark Purple
  'bg-[#016368]', // Dark Teal
  'bg-[#5F7F9B]', // Slate Info
  'bg-[#8A5E80]', // Muted Purple
  'bg-[#4F8A68]', // Forest Green
  'bg-[#6F6A70]', // Neutral Muted
];

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || '?').toUpperCase();
}

function colorFrom(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const sizes = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  name,
  avatar,
  size = 'md',
  className,
}) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn(
          'rounded-full object-cover ring-2 ring-white',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white select-none',
        colorFrom(name),
        sizes[size],
        className
      )}
      title={name}
    >
      {initialsFrom(name)}
    </div>
  );
};
