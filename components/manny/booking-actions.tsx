"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import type { Booking } from "@/lib/store";

export function MannyBookingActions({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"confirm" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (booking.status !== "pending") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-xl text-center text-sm text-muted">
          Status: <span className="font-medium text-ink">{booking.status}</span>
          <br />
          <span className="text-xs text-muted-soft">
            Updated {new Date(booking.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  async function act(action: "confirm" | "decline") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null || pending;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-xl gap-2">
        <button
          type="button"
          onClick={() => act("decline")}
          disabled={disabled}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[12px] border border-rule-strong bg-paper text-base font-semibold text-ink active:translate-y-px disabled:opacity-60"
        >
          {busy === "decline" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <X className="size-5" />
              Decline
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => act("confirm")}
          disabled={disabled}
          className="flex h-14 flex-[1.2] items-center justify-center gap-2 rounded-[12px] bg-brand text-base font-semibold text-paper shadow-[0_2px_0_rgba(0,0,0,0.06)] active:translate-y-px disabled:opacity-60"
        >
          {busy === "confirm" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="size-5" />
              Confirm job
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="mx-auto mt-2 max-w-xl text-center text-xs text-warning">
          {error}
        </p>
      )}
    </div>
  );
}
