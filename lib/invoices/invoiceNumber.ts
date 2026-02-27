/**
 * Generates a deterministic-looking invoice number for a booking.
 * Format: INV-{YEAR}-{FIRST6_OF_BOOKING_UUID_UPPERCASE}
 * e.g. INV-2026-A1B2C3
 */
export function generateInvoiceNo(bookingId: string): string {
  const year = new Date().getFullYear();
  const shortRef = bookingId.slice(0, 6).toUpperCase();
  return `INV-${year}-${shortRef}`;
}
