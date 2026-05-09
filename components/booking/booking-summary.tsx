"use client";

import { Pencil, CheckCircle2, Clock, CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
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

type CartItemDisplay = {
  service: Service;
  breakdown: PriceBreakdown;
};

export function BookingSummary({
  cartItems,
  cartTotal,
  slot,
  address,
  onAddAnother,
  onEditItem,
  onRemoveItem,
  className,
}: {
  cartItems: CartItemDisplay[];
  cartTotal: { totalDollars: number; totalMinutes: number };
  slot: Slot | null;
  address?: AddressLike;
  onAddAnother?: () => void;
  onEditItem?: (index: number) => void;
  onRemoveItem?: (index: number) => void;
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
          Your cart · {cartItems.length} {cartItems.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      <div className="p-5">
        {/* Cart items */}
        <div className="space-y-4">
          {cartItems.map((ci, idx) => (
            <div key={idx} className={cn(idx > 0 && "border-t border-rule pt-4")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-extrabold tracking-tight text-ink">
                    {ci.service.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Clock className="size-3" />
                    {ci.breakdown.totalMinutes} min
                  </p>
                </div>
                <span className="shrink-0 font-display text-base font-bold tabular-nums text-ink">
                  {formatPriceFromDollars(ci.breakdown.totalDollars)}
                </span>
              </div>

              {/* Per-item line items (add-ons) */}
              {ci.breakdown.items.length > 0 && (
                <dl className="mt-2 space-y-0.5 text-xs">
                  {ci.breakdown.items.map((item, i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <dt className="text-muted">{item.label}</dt>
                      <dd className="tabular-nums text-muted">
                        +{formatPriceFromDollars(item.dollars)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {/* Edit / Remove buttons */}
              {(onEditItem || onRemoveItem) && (
                <div className="mt-2 flex gap-3">
                  {onEditItem && (
                    <button
                      type="button"
                      onClick={() => onEditItem(idx)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink focus-ring rounded"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </button>
                  )}
                  {onRemoveItem && cartItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-warning focus-ring rounded"
                    >
                      <Trash2 className="size-3" />
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add another task */}
        {onAddAnother && (
          <button
            type="button"
            onClick={onAddAnother}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-rule-strong py-2.5 text-sm font-medium text-muted hover:border-ink hover:text-ink transition-colors focus-ring"
          >
            <Plus className="size-4" />
            Add another task
          </button>
        )}

        {/* Slot display */}
        {slot && (
          <p className="mt-4 flex items-center gap-1 text-xs text-muted">
            <CalendarDays className="size-3" />
            {formatSlot(slot)}
          </p>
        )}

        {/* Total */}
        <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-4">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Total · {cartTotal.totalMinutes} min
          </span>
          <span className="font-display text-2xl font-black tracking-tight text-ink tabular-nums">
            {formatPriceFromDollars(cartTotal.totalDollars)}
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
