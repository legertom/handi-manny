// Notification stubs. Swap to Resend (email) and Twilio (SMS) when keys are in env.
// TODO: install `resend` + Twilio client and wire actual sends.

import type { Booking } from "./store";
import { mannyBookingUrl } from "./links";

export type NotifyKind =
  | "booking_received"
  | "booking_confirmed"
  | "booking_declined"
  | "reminder_24h"
  | "reminder_morning"
  | "reminder_1h"
  | "manny_new_booking";

export async function notifyCustomer(booking: Booking, kind: NotifyKind): Promise<void> {
  const channel = booking.customer.preferredContact;
  // eslint-disable-next-line no-console
  console.log(
    `[notify:stub] -> ${channel} to ${
      channel === "email" ? booking.customer.email : booking.customer.phone
    } | kind=${kind} | bookingId=${booking.id}`
  );
}

export async function notifyManny(booking: Booking, kind: NotifyKind): Promise<void> {
  // Manny is phone-only — when a new booking lands we text him a deep link he can
  // tap to review and confirm right from the SMS.
  if (kind === "manny_new_booking") {
    const link = mannyBookingUrl(booking.id);
    const when = new Date(booking.scheduledStart).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const body = `New job: ${booking.serviceName} for ${booking.customer.name.split(" ")[0]} on ${when}, ${booking.address.borough}. Tap to review: ${link}`;
    // eslint-disable-next-line no-console
    console.log(`[notify:stub] -> manny SMS | "${body}"`);
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[notify:stub] -> manny | kind=${kind} | bookingId=${booking.id}`);
}
