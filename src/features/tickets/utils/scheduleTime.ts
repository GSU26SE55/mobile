export function toUtcIso(value: Date) {
  if (!Number.isFinite(value.getTime())) throw new Error('Invalid appointment time');
  return value.toISOString();
}

export function formatLocalSchedule(value?: string | null) {
  if (!value) return 'Appointment not available';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Appointment not available';
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const mm = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${date.toLocaleString()} (UTC${sign}${hh}:${mm})`;
}
