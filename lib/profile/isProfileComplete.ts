/**
 * Returns true if all required booking-gate profile fields are non-empty.
 * Used both server-side (POST /api/bookings) and client-side (car detail page).
 */
export function isProfileComplete(user: {
  name?: string | null;
  phone?: string | null;
  nic_passport?: string | null;
  // camelCase aliases (from IUser mapper)
  nicPassport?: string | null;
}): boolean {
  return !!(
    user.name?.trim() &&
    user.phone?.trim() &&
    (user.nic_passport?.trim() ?? user.nicPassport?.trim())
  );
}
