/**
 * Returns a YYYY-MM-DD string from any Date or ISO string.
 * Use this when comparing against DATE columns in Supabase to avoid
 * timezone-shift issues that arise from full ISO timestamps.
 */
export function toDateOnly(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}
