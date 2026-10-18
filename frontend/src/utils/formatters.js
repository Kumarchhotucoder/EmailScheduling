import { format, formatDistanceToNow, isValid } from 'date-fns';

export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (!isValid(date)) return '—';
  return format(date, 'MMM d, yyyy • h:mm a');
}

export function formatDateUTC(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (!isValid(date)) return '—';
  return date.toUTCString();
}

export function formatTimeRelative(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getStatusConfig(status) {
  switch (status) {
    case 'scheduled':
      return {
        label: 'Scheduled',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
        dot: 'bg-indigo-500 dark:bg-indigo-400',
        pulse: false,
      };
    case 'queued':
      return {
        label: 'Queued',
        bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
        dot: 'bg-sky-500',
        pulse: true,
      };
    case 'processing':
      return {
        label: 'Processing',
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
        dot: 'bg-amber-500',
        pulse: true,
      };
    case 'sent':
      return {
        label: 'Sent',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
        pulse: false,
      };
    case 'failed':
      return {
        label: 'Failed',
        bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
        dot: 'bg-rose-500',
        pulse: false,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60',
        dot: 'bg-zinc-400',
        pulse: false,
      };
    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
        dot: 'bg-zinc-400',
        pulse: false,
      };
  }
}
