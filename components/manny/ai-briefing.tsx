"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Loader2, Wrench, AlertTriangle, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Booking } from "@/lib/store";
import type { Briefing } from "@/app/api/briefing/route";

export function AIBriefing({ booking }: { booking: Booking }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking }),
      });
      if (!res.ok) throw new Error();
      const data: Briefing = await res.json();
      setBriefing(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [booking]);

  useEffect(() => {
    generate();
  }, [generate]);

  const complexityStyle = {
    easy: "text-trust",
    standard: "text-brand",
    "heads-up": "text-warning",
  };

  return (
    <section className="mt-6 rounded-[14px] border border-brand/20 bg-brand/5 p-5">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
        <Sparkles className="size-3.5" />
        AI job briefing
      </h2>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin text-brand" />
          Generating briefing…
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm text-warning">
          Couldn&rsquo;t generate briefing.{" "}
          <button
            type="button"
            onClick={generate}
            className="font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {briefing && (
        <div className="mt-3 space-y-4">
          {/* Complexity */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                briefing.estimatedComplexity === "easy" && "border-trust/20 bg-trust/10 text-trust",
                briefing.estimatedComplexity === "standard" && "border-brand/20 bg-brand/10 text-brand",
                briefing.estimatedComplexity === "heads-up" && "border-warning/20 bg-warning/10 text-warning"
              )}
            >
              {briefing.estimatedComplexity}
            </span>
          </div>

          {/* What to expect */}
          <p className="text-sm leading-relaxed text-ink-soft">
            {briefing.whatToExpect}
          </p>

          {/* What to bring */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Wrench className="size-3" />
              Bring
            </h3>
            <ul className="mt-1.5 space-y-1">
              {briefing.whatToBring.map((item, i) => (
                <li key={i} className="text-sm text-ink-soft">
                  — {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Heads up */}
          {briefing.headsUpNotes.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                <AlertTriangle className="size-3" />
                Heads up
              </h3>
              <ul className="mt-1.5 space-y-1">
                {briefing.headsUpNotes.map((note, i) => (
                  <li key={i} className="text-sm text-ink-soft">
                    — {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested order */}
          {briefing.suggestedOrder && briefing.suggestedOrder.length > 1 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <ListOrdered className="size-3" />
                Suggested order
              </h3>
              <ol className="mt-1.5 list-decimal pl-5 space-y-0.5">
                {briefing.suggestedOrder.map((step, i) => (
                  <li key={i} className="text-sm text-ink-soft">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
