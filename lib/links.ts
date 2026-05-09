import type { Booking } from "./store";

/** Build the address string we hand to maps + clipboard. */
export function fullAddress(b: Booking): string {
  const line2 = b.address.line2 ? `, ${b.address.line2}` : "";
  return `${b.address.line1}${line2}, ${b.address.borough}, NY ${b.address.zip}`;
}

/** Open in Apple Maps on iOS, Google Maps everywhere else. */
export function mapsUrl(b: Booking): string {
  const q = encodeURIComponent(fullAddress(b));
  return `https://maps.apple.com/?q=${q}`;
}

/** Pre-filled SMS to the customer. */
export function smsUrl(phone: string, body?: string): string {
  // iOS uses sms:&body=, Android uses sms:?body= — `&` works in both modern OSes.
  const cleaned = phone.replace(/[^\d+]/g, "");
  return body
    ? `sms:${cleaned}&body=${encodeURIComponent(body)}`
    : `sms:${cleaned}`;
}

/** tel: link with cleaned number. */
export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * URL we send to Manny via SMS when a new booking arrives.
 * TODO when we add auth: include a signed token so randos can't visit the page.
 */
export function mannyBookingUrl(bookingId: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${base}/manny/bookings/${bookingId}`;
}
