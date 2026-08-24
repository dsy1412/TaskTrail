export type DurationUnit = "minutes" | "hours" | "days" | "weeks" | "months";

export const durationUnitMinutes: Record<DurationUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 60 * 24,
  weeks: 60 * 24 * 7,
  months: 60 * 24 * 30,
};

export function durationToMinutes(amount: number, unit: DurationUnit) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * durationUnitMinutes[unit]);
}

export function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "Instant";

  if (minutes % durationUnitMinutes.months === 0) return `${minutes / durationUnitMinutes.months}mo`;
  if (minutes % durationUnitMinutes.weeks === 0) return `${minutes / durationUnitMinutes.weeks}w`;
  if (minutes % durationUnitMinutes.days === 0) return `${minutes / durationUnitMinutes.days}d`;

  const hours = Math.floor(minutes / durationUnitMinutes.hours);
  const remainder = minutes % durationUnitMinutes.hours;
  if (hours && remainder) return `${hours}h ${remainder}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

export function normalizeDuration(minutes: number, fallbackMinutes = 60) {
  if (!Number.isFinite(minutes)) return fallbackMinutes;
  return Math.max(0, Math.round(minutes));
}
