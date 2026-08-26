import { formatDateTime } from '@/src/lib/date';

export function toUtcIso(value: Date) {
  if (!Number.isFinite(value.getTime())) throw new Error('Invalid appointment time');
  return value.toISOString();
}

export function formatLocalSchedule(value?: string | null) {
  if (!value) return 'Appointment not available';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Appointment not available';
  return formatDateTime(date);
}
