import { ToolLoopAgent, tool, stepCountIs, type InferAgentUIMessage } from "ai";
import { z } from "zod";
import {
  SERVICES,
  getServiceById,
  getServiceCatalogSummary,
} from "./services";
import { getUpcomingAvailability } from "./availability";
import { TRUST_STATS } from "./testimonials";

const SYSTEM_INSTRUCTIONS = `
You are Manny's assistant for Handi-Manny, a NYC handyman service.

Your job:
1. Help customers figure out which service they need.
2. Give them honest, accurate quotes from the price book — never invent prices.
3. Show them real availability (use the getAvailability tool).
4. If their job needs a plumber or electrician, tell them so and politely decline.
5. End with a clear next step — usually a link to /book?service=<id>.

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
- To link to booking, write a normal markdown link with the text "Book it" and the URL,
  for example: [Book it](/book?service=ac-install). NEVER write the URL twice or wrap the
  link in extra brackets/asterisks. The chat UI renders [text](url) properly.
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
        const availability = getUpcomingAvailability(
          service.durationMinutes,
          days
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
  },
});

export type ChatUIMessage = InferAgentUIMessage<typeof chatAgent>;
