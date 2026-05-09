"use client";

import { Pencil, CheckCircle2, Clock, CalendarDays, MapPin } from "lucide-react";
import type { Service } from "@/lib/services";
import type { PriceBreakdown } from "@/lib/intake";
import type { Slot } from "@/lib/availability";
import { formatPriceFromDollars, cn } from "@/lib/utils";

type AddressLike = {
  line1: string;
  line2?: string;
  borough?: string;
  zip?: string;
};

export function BookingSummary({
  service,
  breakdown,
  slot,
  address,
  onChangeService,
  className,
}: {
  service: Service;
  breakdown: PriceBreakdown;
  slot: Slot | null;
  address?: AddressLike;
  onChangeService?: () => void;
  className?: string;
}) {
  const hasAddress =
    !!address && address.line1.trim().length > 0 && !!address.borough;

  return (
    <div
      className={cn(
        "rounded-[16px] border border-rule bg-paper shadow-[0_1px_0_rgba(30,45,94,0.04),0_4px_16px_-8px_rgba(30,45,94,0.08)] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rule bg-sky/40 px-5 py-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Your booking
        </span>
        {onChangeService && (
          <button
            type="button"
            onClick={onChangeService}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink focus-ring rounded"
          >
            <Pencil className="size-3" />
            Change
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Service line */}
        <h3 className="font-display text-lg font-extrabold tracking-tight text-ink">
          {service.name}
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {breakdown.totalMinutes} min
          </span>
          {slot && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3" />
                {formatSlot(slot)}
              </span>
            </>
          )}
        </p>

        {/* Price breakdown */}
        <dl className="mt-5 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Base</dt>
            <dd className="text-ink tabular-nums">
              {formatPriceFromDollars(breakdown.baseDollars)}
            </dd>
          </div>
          {breakdown.items.map((item, i) => (
            <div key={i} className="flex justify-between gap-3">
              <dt className="text-muted">{item.label}</dt>
              <dd className="text-ink tabular-nums">
                +{formatPriceFromDollars(item.dollars)}
              </dd>
            </div>
          ))}
        </dl>

        {/* Total */}
        <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-4">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Total
          </span>
          <span className="font-display text-2xl font-black tracking-tight text-ink tabular-nums">
            {formatPriceFromDollars(breakdown.totalDollars)}
          </span>
        </div>

        {/* Address (once set) */}
        {hasAddress && (
          <div className="mt-5 rounded-[10px] border border-rule bg-background/60 px-3.5 py-3 text-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <MapPin className="size-3" />
              Address
            </div>
            <p className="mt-1.5 text-ink">
              {address!.line1}
              {address!.line2 ? `, ${address!.line2}` : ""}
              <br />
              <span className="text-muted">
                {address!.borough}, NY {address!.zip}
              </span>
            </p>
          </div>
        )}

        {/* Trust bullets */}
        <ul className="mt-5 space-y-1.5 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-trust" />
            Free cancellation 24+ hr out
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-trust" />
            Charged only after the job
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-trust" />
            Cleanup always included
          </li>
        </ul>
      </div>
    </div>
  );
}

function formatSlot(slot: Slot) {
  const d = new Date(slot.start);
  const day = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day} · ${slot.label}`;
}
