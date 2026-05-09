import { ChevronLeft, Clock } from "lucide-react";
import type { Service } from "@/lib/services";
import type { PriceBreakdown } from "@/lib/intake";
import { formatPriceFromDollars } from "@/lib/utils";

export function ServiceRibbon({
  service,
  breakdown,
  onChange,
}: {
  service: Service;
  breakdown: PriceBreakdown;
  /** When set, renders a "Change" button. */
  onChange?: () => void;
}) {
  const addOnCount = breakdown.items.length;
  const addOnTotal = breakdown.totalDollars - breakdown.baseDollars;

  return (
    <div className="mb-6 rounded-[14px] border border-rule bg-paper p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {onChange && (
          <button
            type="button"
            onClick={onChange}
            aria-label="Change service"
            className="grid size-8 shrink-0 place-items-center rounded-full border border-rule text-muted hover:border-rule-strong hover:text-ink focus-ring"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            You&rsquo;re booking
          </p>
          <p className="mt-0.5 truncate font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
            {service.name}
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            <Clock className="size-3" />
            {breakdown.totalMinutes} min · base {formatPriceFromDollars(service.priceDollars)}
            {addOnCount > 0 && (
              <span>
                {" + "}
                {addOnCount} {addOnCount === 1 ? "add-on" : "add-ons"} ({formatPriceFromDollars(addOnTotal)})
              </span>
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
            {formatPriceFromDollars(breakdown.totalDollars)}
          </span>
        </div>
      </div>
    </div>
  );
}
