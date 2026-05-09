// In-memory bookings store for the demo build.
// TODO: swap to Vercel Marketplace storage (Neon Postgres or Upstash Redis) before launch.
// On Vercel Functions this state is per-instance and resets on cold starts — fine for the demo,
// not fine for production.

import { randomUUID } from "node:crypto";
import type { IntakeAnswers, PriceBreakdown } from "./intake";

export type BookingStatus =
  | "pending"        // submitted by customer, awaiting Manny's confirm
  | "confirmed"      // Manny accepted; payment captured
  | "declined"       // Manny declined; auth voided
  | "completed"      // job done
  | "canceled";      // customer canceled

export type ContactChannel = "sms" | "email";

export type BookingPhoto = {
  id: string;
  url: string;          // either /api/uploads/<id> (demo) or a Vercel Blob URL (prod)
  mimeType: string;
  width?: number;
  height?: number;
};

export type Booking = {
  id: string;
  serviceId: string;
  serviceName: string;
  priceDollars: number;
  durationMinutes: number;
  scheduledStart: string; // ISO
  scheduledEnd: string;   // ISO
  customer: {
    name: string;
    email: string;
    phone: string;
    preferredContact: ContactChannel;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    borough: string;
    zip: string;
    accessNotes?: string;
  };
  taskDetails?: string;
  photos: BookingPhoto[];
  intakeAnswers: IntakeAnswers;
  selectedAddonIds: string[];
  priceBreakdown: PriceBreakdown;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  // Stripe placeholders — will be real PaymentIntent IDs once keys are configured.
  stripePaymentIntentId?: string;
  stripeAuthorizationStatus?: "authorized" | "captured" | "voided" | "failed";
};

declare global {
  // eslint-disable-next-line no-var
  var __HANDIMANNY_STORE__: Map<string, Booking> | undefined;
}

const store: Map<string, Booking> = (globalThis.__HANDIMANNY_STORE__ ??= new Map());

export function listBookings(): Booking[] {
  return Array.from(store.values()).sort((a, b) =>
    a.scheduledStart.localeCompare(b.scheduledStart)
  );
}

export function getBooking(id: string): Booking | undefined {
  return store.get(id);
}

export function createBooking(
  input: Omit<Booking, "id" | "status" | "createdAt" | "updatedAt">
): Booking {
  const now = new Date().toISOString();
  const booking: Booking = {
    ...input,
    id: randomUUID(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  store.set(booking.id, booking);
  return booking;
}

export function updateBooking(
  id: string,
  patch: Partial<Omit<Booking, "id" | "createdAt">>
): Booking | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;
  const next: Booking = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  store.set(id, next);
  return next;
}
