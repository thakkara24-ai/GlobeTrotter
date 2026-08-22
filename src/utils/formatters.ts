import { format, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
};

export const formatDate = (dateStr: string | Date | undefined, formatStr = 'MMM d, yyyy'): string => {
  if (!dateStr) return '';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(d) ? format(d, formatStr) : '';
  } catch {
    return '';
  }
};

export const formatDateRange = (start?: string | Date, end?: string | Date): string => {
  if (!start || !end) return '';
  return `${formatDate(start, 'MMM d')} - ${formatDate(end, 'MMM d, yyyy')}`;
};

export const formatDuration = (hours?: number): string => {
  if (!hours) return '';
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
};
