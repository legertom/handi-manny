"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Wrench,
  ArrowRight,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Estimate } from "@/app/api/estimate/route";

const EXAMPLE_PROMPTS = [
  "Mount a 65 inch TV on a brick wall in my living room. I need the cables hidden inside the wall. I have the TV but no mount.",
  "I just moved into a new apartment in Brooklyn. I need to build two IKEA dressers, hang some art, and install a window AC unit.",
  "I have about 6 holes in my walls from old picture frames and anchors. The walls are plaster in a prewar building. I'd also like to hang 4 new frames.",
];

export default function EstimatePage() {
  const [description, setDescription] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(text?: string) {
    const desc = text ?? description;
    if (desc.trim().length < 10) return;

    setLoading(true);
    setError(null);
    setEstimate(null);

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate estimate");
      }

      const data: Estimate = await res.json();
      setEstimate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
          <Sparkles className="size-3" />
          AI-powered
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Instant estimate
        </h1>
        <p className="mt-2 text-base text-ink-soft">
          Describe your job in plain English. Our AI will match it to the right
          service, price it from Manny&rsquo;s rate card, and tell you what to
          have ready.
        </p>
      </div>

      {/* Input */}
      <div className="rounded-[16px] border border-rule bg-paper p-5">
        <label
          htmlFor="job-description"
          className="mb-2 block text-sm font-semibold text-ink"
        >
          What do you need done?
        </label>
        <textarea
          id="job-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Mount a 65&quot; TV on a brick wall, hide the cables, and I don't have a mount..."
          rows={4}
          className="w-full resize-none rounded-[10px] border border-rule bg-background p-3 text-base text-ink placeholder:text-muted-soft outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {description.length < 10
              ? "At least 10 characters"
              : `${description.length} characters`}
          </p>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading || description.trim().length < 10}
            className={cn(
              "inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-semibold text-paper transition-colors",
              loading || description.trim().length < 10
                ? "cursor-not-allowed bg-rule-strong"
                : "bg-brand hover:bg-brand-hover"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Estimating…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Get estimate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example prompts */}
      {!estimate && !loading && (
        <div className="mt-6">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Try an example
          </p>
          <div className="grid gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setDescription(prompt);
                  handleSubmit(prompt);
                }}
                className="rounded-[10px] border border-rule bg-paper px-4 py-3 text-left text-sm text-ink-soft hover:border-rule-strong hover:text-ink"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-[12px] border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mb-1 inline size-4" /> {error}
        </div>
      )}

      {/* Results */}
      {estimate && <EstimateResult estimate={estimate} />}
    </div>
  );
}

function EstimateResult({ estimate }: { estimate: Estimate }) {
  const complexityColor = {
    straightforward: "text-trust bg-trust/10 border-trust/20",
    moderate: "text-brand bg-brand/10 border-brand/20",
    complex: "text-warning bg-warning/10 border-warning/20",
  }[estimate.complexity];

  return (
    <div className="mt-8 space-y-5">
      {/* Header */}
      <div className="rounded-[16px] border border-rule bg-paper p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted">Recommended service</p>
            <p className="mt-0.5 font-display text-xl font-bold text-ink">
              {estimate.recommendedServiceName}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{estimate.summary}</p>
          </div>
          <div
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize",
              complexityColor
            )}
          >
            {estimate.complexity}
          </div>
        </div>

        {!estimate.canHandle && estimate.specialistReason && (
          <div className="mt-4 rounded-[10px] border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            <AlertTriangle className="mb-0.5 inline size-4" />{" "}
            {estimate.specialistReason}
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="rounded-[16px] border border-rule bg-paper p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <DollarSign className="size-4 text-brand" />
          Price breakdown
        </h3>
        <div className="space-y-2">
          {estimate.lineItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-ink-soft">
                {item.included ? (
                  <CheckCircle2 className="mr-1.5 inline size-3.5 text-trust" />
                ) : (
                  <span className="mr-1.5 inline-block size-3.5" />
                )}
                {item.label}
              </span>
              <span className="font-mono text-ink">
                ${item.dollars}
              </span>
            </div>
          ))}
          <div className="border-t border-rule pt-2">
            <div className="flex items-center justify-between text-base font-bold text-ink">
              <span>Estimated total</span>
              <span className="font-mono">${estimate.estimatedTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Duration + Materials */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-[16px] border border-rule bg-paper p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Clock className="size-4 text-brand" />
            Duration
          </h3>
          <p className="text-lg font-semibold text-ink">
            {estimate.estimatedDuration}
          </p>
        </div>

        <div className="rounded-[16px] border border-rule bg-paper p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Package className="size-4 text-brand" />
            Have ready
          </h3>
          <ul className="space-y-1 text-sm text-ink-soft">
            {estimate.materialsNeeded.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <Wrench className="mt-0.5 size-3 shrink-0 text-muted" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Notes */}
      {estimate.notes.length > 0 && (
        <div className="rounded-[16px] border border-rule bg-paper p-5">
          <h3 className="mb-2 text-sm font-semibold text-ink">
            Notes
          </h3>
          <ul className="space-y-1.5 text-sm text-ink-soft">
            {estimate.notes.map((note, i) => (
              <li key={i}>— {note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      {estimate.canHandle && (
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
          <Link
            href={`/book?service=${estimate.recommendedServiceId}`}
            className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-6 py-3 text-sm font-semibold text-paper hover:bg-brand-hover"
          >
            Book this service
            <ArrowRight className="size-4" />
          </Link>
          <span className="text-xs text-muted">
            or chat with Manny&rsquo;s assistant for more details
          </span>
        </div>
      )}
    </div>
  );
}
