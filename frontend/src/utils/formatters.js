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
        bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        dot: 'bg-indigo-400',
        pulse: false,
      };
    case 'queued':
      return {
        label: 'Queued',
        bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        dot: 'bg-sky-400',
        pulse: true,
      };
    case 'processing':
      return {
        label: 'Processing',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dot: 'bg-amber-400',
        pulse: true,
      };
    case 'sent':
      return {
        label: 'Sent',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-400',
        pulse: false,
      };
    case 'failed':
      return {
        label: 'Failed',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dot: 'bg-rose-400',
        pulse: false,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        dot: 'bg-slate-400',
        pulse: false,
      };
    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        dot: 'bg-slate-400',
        pulse: false,
      };
  }
}
