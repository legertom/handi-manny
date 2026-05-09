import { generateText, Output } from "ai";
import { z } from "zod";
import { getServiceCatalogSummary } from "@/lib/services";

export const maxDuration = 30;

const EstimateSchema = z.object({
  summary: z
    .string()
    .describe("One-sentence summary of the job"),
  recommendedServiceId: z
    .string()
    .describe("Best-fit service ID from the catalog"),
  recommendedServiceName: z.string(),
  lineItems: z
    .array(
      z.object({
        label: z.string(),
        dollars: z.number(),
        included: z
          .boolean()
          .describe("True if included in the base price, false if an add-on"),
      })
    )
    .describe("Itemized breakdown of costs"),
  estimatedTotal: z
    .number()
    .describe("Total estimated price in dollars"),
  estimatedDuration: z
    .string()
    .describe("Human-readable duration estimate, e.g. '60–90 minutes'"),
  materialsNeeded: z
    .array(z.string())
    .describe("Materials/tools the customer should have ready"),
  complexity: z
    .enum(["straightforward", "moderate", "complex"])
    .describe("Job complexity assessment"),
  notes: z
    .array(z.string())
    .describe("Important notes, warnings, or recommendations"),
  canHandle: z
    .boolean()
    .describe("False if this requires a licensed specialist (plumber, electrician, etc.)"),
  specialistReason: z
    .string()
    .optional()
    .describe("If canHandle is false, explain why a specialist is needed"),
});

export type Estimate = z.infer<typeof EstimateSchema>;

export async function POST(request: Request) {
  const { description } = (await request.json()) as { description: string };

  if (!description || description.trim().length < 10) {
    return Response.json(
      { error: "Please describe your job in more detail." },
      { status: 400 }
    );
  }

  const catalog = getServiceCatalogSummary();

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: EstimateSchema }),
    prompt: `You are Manny's estimating assistant for Handi-Manny, a NYC handyman service.

Given the customer's job description below, generate a detailed estimate.

SERVICE CATALOG (use these exact prices as your baseline):
${JSON.stringify(catalog, null, 2)}

RULES:
- Always match to the closest service in the catalog. Use the catalog price as the base.
- Add line items for extras (e.g., oversized TV +$40, in-wall cables +$80).
- If the job needs multiple services, use a Half-Day Block ($399/4hr) or Full-Day Block ($749/8hr).
- If it requires a licensed plumber, electrician, or other specialist, set canHandle=false.
- Be realistic about duration and complexity.
- Materials list should be practical — what should the customer have on-site.

CUSTOMER'S JOB DESCRIPTION:
${description}`,
  });

  return Response.json(output);
}
