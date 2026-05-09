import { ToolLoopAgent, tool, stepCountIs, type InferAgentUIMessage } from "ai";
import { z } from "zod";
import {
  SERVICES,
  getServiceById,
  getServiceCatalogSummary,
} from "./services";
import { getUpcomingAvailability } from "./availability";
import { createBooking as storeBooking } from "./store";
import { computeBreakdown } from "./intake";
import { TRUST_STATS } from "./testimonials";
import { addMinutes, parseISO } from "date-fns";

const SYSTEM_INSTRUCTIONS = `
You are Manny's assistant for Handi-Manny, a NYC handyman service.

Your job:
1. Help customers figure out which service they need.
2. Give them honest, accurate quotes from the price book — never invent prices.
3. Show them real availability (use the getAvailability tool).
4. If their job needs a plumber or electrician, tell them so and politely decline.
5. When a customer is ready, you can book them directly using the createBooking tool.
   Collect their name, email, phone, address (with borough and ZIP), and preferred time slot.
   Confirm details before creating.
6. If a customer sends a photo URL, use the analyzePhoto tool to scope the job visually.

Booking flow in chat:
- First identify the right service and price.
- Check availability for the service.
- Ask for their preferred date/time from the available slots.
- Collect contact info: name, email, phone.
- Collect address: street, borough, ZIP, any access notes.
- Confirm everything, then call createBooking.
- After booking, share the confirmation link: /book/confirmation/<bookingId>

Guardrails:
- Manny is a handyman, NOT a plumber or licensed electrician. He won't open walls,
  do permitted electrical work, or touch gas lines. Be honest about this.
- Pricing comes from the catalog tool. If a customer's job doesn't fit a flat-rate,
  recommend the Half-Day Block (id: block-half, $399 / 4 hr) or Handyman Hour (id: hourly, $119/hr).
- We serve all 5 NYC boroughs.
- ${TRUST_STATS.yearsExperience} years experience, ${TRUST_STATS.jobsCompleted}+ jobs, 5.0 on TaskRabbit.
- Card is authorized at booking and only captured after the job is done.
- Free cancellation 24+ hours before; 50% within 24 hr; 100% no-show.

Voice:
- Warm, direct, no fluff. Sound like a NYC tradesperson, not a chatbot.
- No emojis.
- If you don't know something, say so — don't make it up.

Output format (STRICT — you're rendering in a narrow ~400px chat panel):
- Conversational prose, short paragraphs. 2–4 sentences max per paragraph.
- NO tables. NO ASCII art. Never use pipe characters for layout.
- For lists: one item per line, optionally prefixed with "- ". Keep lists short (3–5 items).
- For prices, write them inline like "$179".
- When you create a booking successfully, present a short confirmation and a link:
  [View your booking](/book/confirmation/<id>)
- For availability, summarize at a high level. Example:
    "Saturday's tight — only an evening slot at 5:30. Sunday and Monday are wide open
    from morning. Want me to grab a specific time?"
  Do not enumerate every 30-minute slot.
- Never use bold or italic markdown unless emphasizing one critical word.
`.trim();

export const chatAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.6",
  instructions: SYSTEM_INSTRUCTIONS,
  stopWhen: stepCountIs(8),
  tools: {
    listServices: tool({
      description:
        "Get the full Handi-Manny service catalog with prices and durations. Call this when the user is asking what we do, or to confirm a price before quoting.",
      inputSchema: z.object({}),
      execute: async () => {
        return { services: getServiceCatalogSummary() };
      },
    }),

    getServiceDetails: tool({
      description:
        "Get detailed information about one specific service (what's included, what's not, exact duration).",
      inputSchema: z.object({
        serviceId: z
          .string()
          .describe(
            `One of: ${SERVICES.map((s) => s.id).join(", ")}`
          ),
      }),
      execute: async ({ serviceId }) => {
        const service = getServiceById(serviceId);
        if (!service) return { error: "Unknown service" };
        return {
          id: service.id,
          slug: service.slug,
          name: service.name,
          priceDollars: service.priceDollars,
          durationMinutes: service.durationMinutes,
          description: service.description,
          includes: service.includes,
          excludes: service.excludes ?? [],
          bookUrl: `/book?service=${service.id}`,
        };
      },
    }),

    getAvailability: tool({
      description:
        "Check Manny's actual upcoming availability for a service. Returns slot start times for each of the next N days.",
      inputSchema: z.object({
        serviceId: z
          .string()
          .describe(
            `Service to check availability for. One of: ${SERVICES.map((s) => s.id).join(", ")}`
          ),
        days: z
          .number()
          .int()
          .min(1)
          .max(14)
          .default(7)
          .describe("How many days ahead to check (max 14)."),
      }),
      execute: async ({ serviceId, days }) => {
        const service = getServiceById(serviceId);
        if (!service) return { error: "Unknown service" };
        const availability = await getUpcomingAvailability(
          service.durationMinutes,
          days,
        );
        return {
          service: service.name,
          durationMinutes: service.durationMinutes,
          days: availability.map((d) => ({
            date: d.date,
            weekday: d.weekday,
            slotCount: d.slots.length,
            // Limit to 6 sample times per day to keep tokens lean.
            sampleTimes: d.slots.slice(0, 6).map((s) => s.label),
          })),
        };
      },
    }),

    refuseSpecialistJob: tool({
      description:
        "Use this ONLY when the customer's job clearly requires a licensed plumber, electrician, or other specialist Manny doesn't cover. It tags the conversation so we can recommend they hire a specialist.",
      inputSchema: z.object({
        reason: z
          .string()
          .describe("Why this needs a specialist (e.g., 'opening wall to replace pipe')."),
      }),
      execute: async ({ reason }) => ({ acknowledged: true, reason }),
    }),

    createBooking: tool({
      description:
        "Create a real booking after collecting all required info from the customer. " +
        "You MUST have: serviceId, a valid slot (start ISO datetime), customer name/email/phone, " +
        "and address with borough and ZIP. Confirm all details with the customer before calling this.",
      inputSchema: z.object({
        serviceId: z
          .string()
          .describe(`One of: ${SERVICES.map((s) => s.id).join(", ")}`),
        slotStart: z
          .string()
          .describe("ISO datetime for the slot start (e.g., '2026-05-12T09:00:00.000Z')"),
        customerName: z.string().describe("Full name"),
        customerEmail: z.string().email().describe("Email address"),
        customerPhone: z.string().describe("Phone number"),
        preferredContact: z
          .enum(["sms", "email"])
          .default("sms")
          .describe("How the customer prefers to be reached"),
        addressLine1: z.string().describe("Street address"),
        addressLine2: z.string().optional().describe("Apt/unit"),
        borough: z
          .enum(["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"])
          .describe("NYC borough"),
        zip: z.string().describe("5-digit ZIP code"),
        accessNotes: z.string().optional().describe("Buzzer code, doorman, stairs, etc."),
        taskDetails: z.string().optional().describe("Any extra notes about the job"),
      }),
      execute: async (input) => {
        const service = getServiceById(input.serviceId);
        if (!service) return { error: "Unknown service" };

        const breakdown = computeBreakdown(service, {}, []);
        const start = parseISO(input.slotStart);
        const end = addMinutes(start, service.durationMinutes);

        const singleItem = {
          serviceId: service.id,
          serviceName: service.name,
          intakeAnswers: {},
          selectedAddonIds: [] as string[],
          taskDetails: input.taskDetails,
          photos: [] as { id: string; url: string; mimeType: string }[],
          priceBreakdown: breakdown,
        };

        const booking = await storeBooking({
          items: [singleItem],
          serviceId: service.id,
          serviceName: service.name,
          priceDollars: breakdown.totalDollars,
          durationMinutes: breakdown.totalMinutes,
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
          customer: {
            name: input.customerName,
            email: input.customerEmail,
            phone: input.customerPhone,
            preferredContact: input.preferredContact,
          },
          address: {
            line1: input.addressLine1,
            line2: input.addressLine2,
            city: "New York",
            borough: input.borough,
            zip: input.zip,
            accessNotes: input.accessNotes,
          },
          taskDetails: input.taskDetails,
          photos: [],
          intakeAnswers: {},
          selectedAddonIds: [],
          priceBreakdown: breakdown,
        });

        return {
          success: true,
          bookingId: booking.id,
          serviceName: booking.serviceName,
          priceDollars: booking.priceDollars,
          scheduledStart: booking.scheduledStart,
          scheduledEnd: booking.scheduledEnd,
          confirmationUrl: `/book/confirmation/${booking.id}`,
        };
      },
    }),

    analyzePhoto: tool({
      description:
        "Analyze a photo URL the customer shared to help scope the job. " +
        "Use this when the customer mentions they have a photo or describes something visual. " +
        "Returns a structured assessment of what the photo shows and which service fits.",
      inputSchema: z.object({
        photoUrl: z.string().describe("URL of the photo to analyze"),
        customerContext: z
          .string()
          .describe("What the customer said about this photo / what they need help with"),
      }),
      execute: async ({ photoUrl, customerContext }) => {
        return {
          analyzed: true,
          photoUrl,
          context: customerContext,
          note: "Photo received. The AI model will use its vision capabilities to assess this image inline with the conversation.",
        };
      },
    }),
  },
});

export type ChatUIMessage = InferAgentUIMessage<typeof chatAgent>;
