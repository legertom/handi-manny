import { generateText, Output } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const BriefingSchema = z.object({
  whatToBring: z
    .array(z.string())
    .describe("Specific tools and materials Manny should bring"),
  whatToExpect: z
    .string()
    .describe("One-paragraph plain-language summary of the job for Manny"),
  estimatedComplexity: z
    .enum(["easy", "standard", "heads-up"])
    .describe("How much attention this job needs"),
  headsUpNotes: z
    .array(z.string())
    .describe("Anything Manny should watch out for — access issues, heavy items, tricky walls, etc."),
  suggestedOrder: z
    .array(z.string())
    .optional()
    .describe("If multiple tasks, the recommended order to tackle them"),
});

export type Briefing = z.infer<typeof BriefingSchema>;

export async function POST(request: Request) {
  const { booking } = await request.json();

  if (!booking) {
    return Response.json({ error: "Booking data required" }, { status: 400 });
  }

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: BriefingSchema }),
    prompt: `You are generating a job briefing for Manny, a NYC handyman with 10 years experience.

Given this booking, create a practical briefing he can read on his phone before heading out.

BOOKING DETAILS:
- Services: ${(booking.items ?? [{ serviceName: booking.serviceName, intakeAnswers: booking.intakeAnswers, selectedAddonIds: booking.selectedAddonIds, taskDetails: booking.taskDetails, photos: booking.photos }]).map((i: { serviceName: string }) => i.serviceName).join(", ")}
- Total price: $${booking.priceDollars}
- Total duration: ${booking.durationMinutes} minutes
- When: ${booking.scheduledStart}
- Customer: ${booking.customer?.name ?? "Unknown"}
- Borough: ${booking.address?.borough ?? "Unknown"}
- Address: ${booking.address?.line1 ?? "Unknown"}
- Access notes: ${booking.address?.accessNotes ?? "None"}
${(booking.items ?? [{ serviceName: booking.serviceName, intakeAnswers: booking.intakeAnswers, selectedAddonIds: booking.selectedAddonIds, taskDetails: booking.taskDetails, photos: booking.photos }]).map((item: { serviceName: string; taskDetails?: string; intakeAnswers: Record<string, unknown>; selectedAddonIds: string[]; photos?: unknown[] }, idx: number) => `
TASK ${idx + 1}: ${item.serviceName}
- Task details: ${item.taskDetails ?? "None provided"}
- Intake answers: ${JSON.stringify(item.intakeAnswers ?? {})}
- Add-ons: ${JSON.stringify(item.selectedAddonIds ?? [])}
- Photos: ${item.photos?.length ?? 0} attached`).join("\n")}

RULES:
- Be practical and specific. "Bring a stud finder" is better than "bring appropriate tools."
- Flag real concerns (prewar plaster, heavy units, tight access) but don't invent problems.
- For multi-task jobs (blocks), suggest an efficient order.
- Keep it short — this is a phone screen, not a document.`,
  });

  return Response.json(output);
}
