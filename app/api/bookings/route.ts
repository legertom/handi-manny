import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createBooking, type BookingItem } from "@/lib/store";
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

const ItemSchema = z.object({
  serviceId: z.string().min(1),
  intakeAnswers: z.record(z.string(), IntakeAnswerSchema).default({}),
  selectedAddonIds: z.array(z.string().max(80)).max(20).default([]),
  taskDetails: z.string().max(2000).optional().default(""),
  photos: z.array(PhotoSchema).max(5).optional().default([]),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1).max(10),
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

  // Validate each item and compute breakdowns.
  const bookingItems: BookingItem[] = [];
  let totalDollars = 0;
  let totalMinutes = 0;

  for (const item of data.items) {
    const service = getServiceById(item.serviceId);
    if (!service) {
      return NextResponse.json({ error: `Unknown service: ${item.serviceId}` }, { status: 404 });
    }

    const intakeCheck = validateIntake(service, item.intakeAnswers, item.selectedAddonIds);
    if (!intakeCheck.ok) {
      return NextResponse.json(
        {
          error: `Invalid intake for ${service.name}`,
          reason: intakeCheck.reason,
          hardBlock: intakeCheck.hardBlock,
        },
        { status: 422 }
      );
    }

    const breakdown = computeBreakdown(service, item.intakeAnswers, item.selectedAddonIds);
    totalDollars += breakdown.totalDollars;
    totalMinutes += breakdown.totalMinutes;

    bookingItems.push({
      serviceId: service.id,
      serviceName: service.name,
      intakeAnswers: item.intakeAnswers,
      selectedAddonIds: item.selectedAddonIds,
      taskDetails: item.taskDetails,
      photos: item.photos,
      priceBreakdown: breakdown,
    });
  }

  const firstItem = bookingItems[0];

  const booking = await createBooking({
    items: bookingItems,
    serviceId: firstItem.serviceId,
    serviceName: firstItem.serviceName,
    intakeAnswers: firstItem.intakeAnswers,
    selectedAddonIds: firstItem.selectedAddonIds,
    taskDetails: firstItem.taskDetails,
    photos: firstItem.photos,
    priceBreakdown: firstItem.priceBreakdown,
    priceDollars: totalDollars,
    durationMinutes: totalMinutes,
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
  });

  const auth = await authorizeCard({
    bookingId: booking.id,
    amountDollars: totalDollars,
  });

  after(async () => {
    const serviceList = bookingItems.map((i) => i.serviceName).join(", ");

    const confirmationSchema = z.object({
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Friendly confirmation message, 2-3 short paragraphs"),
      mannyHeadsUp: z.string().describe("One-line SMS-length heads-up for Manny"),
    });

    try {
      const { output: message } = await generateText({
        model: "anthropic/claude-sonnet-4.6",
        output: Output.object({ schema: confirmationSchema }),
        prompt: `Generate a booking confirmation for:
- Customer: ${booking.customer.name}
- Services: ${serviceList} ($${totalDollars} total)
- When: ${booking.scheduledStart}
- Where: ${booking.address.borough}, NY
- Number of tasks: ${bookingItems.length}

For the customer email: be warm, include what to have ready, mention free cancellation 24hr+ out.
For Manny's SMS: keep it under 160 chars, include customer first name, services, date, and borough.`,
      });

      if (message) {
        console.log(`[after] AI confirmation for booking ${booking.id}:`, {
          subject: message.subject,
          bodyLength: message.body.length,
          mannySms: message.mannyHeadsUp,
        });
      }
    } catch (err) {
      console.error(`[after] AI confirmation generation failed:`, err);
    }

    await Promise.allSettled([
      notifyCustomer(booking, "booking_received"),
      notifyManny(booking, "manny_new_booking"),
    ]);
  });

  return NextResponse.json(
    {
      id: booking.id,
      status: booking.status,
      authorization: auth,
    },
    { status: 201 }
  );
}
