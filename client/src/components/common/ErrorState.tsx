import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-[#F9EFEF]/60 border border-[#F0D1D1] rounded-2xl shadow-xs">
      <div className="w-12 h-12 rounded-xl bg-[#F9EFEF] border border-[#F0D1D1] text-[#B85C5C] flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#2F2930] mb-1 font-display">{title}</h3>
      <p className="text-xs text-[#6F6A70] max-w-sm mb-4 leading-relaxed font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Try Again
        </Button>
      )}
    </div>
  );
};
