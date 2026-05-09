import { NextResponse } from "next/server";
import { z } from "zod";
import { createBooking } from "@/lib/store";
import { getServiceById } from "@/lib/services";
import { authorizeCard } from "@/lib/stripe";
import { notifyCustomer, notifyManny } from "@/lib/notify";
import { computeBreakdown, validateIntake } from "@/lib/intake";

const PhotoSchema = z.object({
  id: z.string().min(1).max(80),
  url: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(80),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const IntakeAnswerSchema = z.union([
  z.string().max(2000),
  z.array(z.string().max(200)).max(20),
]);

const BodySchema = z.object({
  serviceId: z.string().min(1),
  intakeAnswers: z.record(z.string(), IntakeAnswerSchema).default({}),
  selectedAddonIds: z.array(z.string().max(80)).max(20).default([]),
  taskDetails: z.string().max(2000).optional().default(""),
  photos: z.array(PhotoSchema).max(5).optional().default([]),
  slot: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    label: z.string(),
  }),
  customer: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().min(10).max(30),
    preferredContact: z.enum(["sms", "email"]),
  }),
  address: z.object({
    line1: z.string().min(3).max(200),
    line2: z.string().max(200).optional().default(""),
    city: z.string().max(80).default("New York"),
    borough: z.enum(["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]),
    zip: z.string().regex(/^\d{5}$/),
    accessNotes: z.string().max(2000).optional().default(""),
  }),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const service = getServiceById(data.serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }

  // Server is the source of truth for intake validity + price.
  const intakeCheck = validateIntake(service, data.intakeAnswers, data.selectedAddonIds);
  if (!intakeCheck.ok) {
    return NextResponse.json(
      {
        error: "Invalid intake",
        reason: intakeCheck.reason,
        hardBlock: intakeCheck.hardBlock,
      },
      { status: 422 }
    );
  }

  const breakdown = computeBreakdown(service, data.intakeAnswers, data.selectedAddonIds);

  // Create booking first so we have an ID for the Stripe metadata.
  const booking = createBooking({
    serviceId: service.id,
    serviceName: service.name,
    priceDollars: breakdown.totalDollars,
    durationMinutes: breakdown.totalMinutes,
    scheduledStart: data.slot.start,
    scheduledEnd: data.slot.end,
    customer: data.customer,
    address: {
      line1: data.address.line1,
      line2: data.address.line2 || undefined,
      city: data.address.city,
      borough: data.address.borough,
      zip: data.address.zip,
      accessNotes: data.address.accessNotes || undefined,
    },
    taskDetails: data.taskDetails,
    photos: data.photos,
    intakeAnswers: data.intakeAnswers,
    selectedAddonIds: data.selectedAddonIds,
    priceBreakdown: breakdown,
  });

  // Authorize (placeholder until Stripe is wired).
  const auth = await authorizeCard({
    bookingId: booking.id,
    amountDollars: breakdown.totalDollars,
  });

  // Best-effort notifications — don't fail the booking on a stub log.
  await Promise.allSettled([
    notifyCustomer(booking, "booking_received"),
    notifyManny(booking, "manny_new_booking"),
  ]);

  return NextResponse.json(
    {
      id: booking.id,
      status: booking.status,
      authorization: auth,
    },
    { status: 201 }
  );
}
