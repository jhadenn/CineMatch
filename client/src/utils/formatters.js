/**
 * Compact runtime label for row/card metadata where missing values should read
 * as unavailable rather than zero minutes.
 */
export function formatRuntimeShort(minutes) {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return 'Runtime N/A';

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours <= 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Dashboard stat runtime formatter. Longer totals roll up into days so summary
 * cards stay short even for heavy watch histories.
 */
export function formatRuntimeStat(minutes) {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0h';

  const totalHours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (totalHours > 0) {
    return mins > 0 ? `${totalHours}h ${mins}m` : `${totalHours}h`;
  }

  return `${mins}m`;
}

/**
 * Shared one-decimal rating formatter with caller-provided fallback text.
 */
export function formatRating(value, fallback = 'N/A') {
  const rating = Number(value);
  return Number.isFinite(rating) ? rating.toFixed(1) : fallback;
}
