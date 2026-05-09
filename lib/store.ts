import { supabaseAdmin } from "./supabase/admin";
import type { IntakeAnswers, PriceBreakdown } from "./intake";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "completed"
  | "canceled";

export type ContactChannel = "sms" | "email";

export type BookingPhoto = {
  id: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
};

export type BookingItem = {
  serviceId: string;
  serviceName: string;
  intakeAnswers: IntakeAnswers;
  selectedAddonIds: string[];
  taskDetails?: string;
  photos: BookingPhoto[];
  priceBreakdown: PriceBreakdown;
};

export type Booking = {
  id: string;
  items: BookingItem[];
  // Derived from first item — kept for convenience in single-service code paths.
  serviceId: string;
  serviceName: string;
  intakeAnswers: IntakeAnswers;
  selectedAddonIds: string[];
  taskDetails?: string;
  photos: BookingPhoto[];
  priceBreakdown: PriceBreakdown;
  // Aggregated across all items.
  priceDollars: number;
  durationMinutes: number;
  scheduledStart: string;
  scheduledEnd: string;
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
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  stripePaymentIntentId?: string;
  stripeAuthorizationStatus?: "authorized" | "captured" | "voided" | "failed";
};

// ---------------------------------------------------------------------------
// Row ↔ Booking mapping
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBooking(row: any): Booking {
  return {
    id: row.id,
    items: row.items ?? [],
    serviceId: row.service_id,
    serviceName: row.service_name,
    priceDollars: Number(row.price_dollars),
    durationMinutes: row.duration_minutes,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      preferredContact: row.customer_preferred_contact,
    },
    address: {
      line1: row.address_line1,
      line2: row.address_line2 || undefined,
      city: row.address_city,
      borough: row.address_borough,
      zip: row.address_zip,
      accessNotes: row.address_access_notes || undefined,
    },
    taskDetails: row.task_details || undefined,
    photos: row.photos ?? [],
    intakeAnswers: row.intake_answers ?? {},
    selectedAddonIds: row.selected_addon_ids ?? [],
    priceBreakdown: row.price_breakdown ?? {
      baseDollars: 0,
      items: [],
      totalDollars: 0,
      totalMinutes: 0,
    },
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
    stripeAuthorizationStatus: row.stripe_authorization_status || undefined,
  };
}

function bookingToRow(
  input: Omit<Booking, "id" | "status" | "createdAt" | "updatedAt">,
) {
  return {
    items: input.items,
    service_id: input.serviceId,
    service_name: input.serviceName,
    price_dollars: input.priceDollars,
    duration_minutes: input.durationMinutes,
    scheduled_start: input.scheduledStart,
    scheduled_end: input.scheduledEnd,
    customer_name: input.customer.name,
    customer_email: input.customer.email,
    customer_phone: input.customer.phone,
    customer_preferred_contact: input.customer.preferredContact,
    address_line1: input.address.line1,
    address_line2: input.address.line2 ?? null,
    address_city: input.address.city,
    address_borough: input.address.borough,
    address_zip: input.address.zip,
    address_access_notes: input.address.accessNotes ?? null,
    task_details: input.taskDetails ?? null,
    photos: input.photos,
    intake_answers: input.intakeAnswers,
    selected_addon_ids: input.selectedAddonIds,
    price_breakdown: input.priceBreakdown,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listBookings(): Promise<Booking[]> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .order("scheduled_start", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToBooking);
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined;
    throw error;
  }
  return data ? rowToBooking(data) : undefined;
}

export async function createBooking(
  input: Omit<Booking, "id" | "status" | "createdAt" | "updatedAt">,
): Promise<Booking> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .insert(bookingToRow(input))
    .select()
    .single();

  if (error) throw error;
  return rowToBooking(data);
}

export async function updateBooking(
  id: string,
  patch: Partial<Omit<Booking, "id" | "createdAt">>,
): Promise<Booking | undefined> {
  // Map app-level fields to DB columns.
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.stripePaymentIntentId !== undefined)
    row.stripe_payment_intent_id = patch.stripePaymentIntentId;
  if (patch.stripeAuthorizationStatus !== undefined)
    row.stripe_authorization_status = patch.stripeAuthorizationStatus;
  if (patch.photos !== undefined) row.photos = patch.photos;
  if (patch.taskDetails !== undefined) row.task_details = patch.taskDetails;

  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined;
    throw error;
  }
  return data ? rowToBooking(data) : undefined;
}
