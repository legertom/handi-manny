"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPriceFromDollars, cn } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/lib/store";
import { telUrl, smsUrl } from "@/lib/links";
import {
  CheckCircle2,
  X,
  Clock,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  CalendarDays,
  Inbox,
  Sparkles,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";

const TABS: { id: BookingStatus | "all"; label: string }[] = [
  { id: "pending", label: "Awaiting confirm" },
  { id: "confirmed", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

export function MannyDashboard({ initialBookings }: { initialBookings: Booking[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<BookingStatus | "all">("pending");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts: Record<string, number> = initialBookings.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      acc.all = (acc.all ?? 0) + 1;
      return acc;
    },
    { all: 0 } as Record<string, number>
  );

  const filtered = initialBookings.filter((b) =>
    tab === "all" ? true : b.status === tab
  );

  async function act(id: string, action: "confirm" | "decline") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error("Action failed");
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      alert("Hmm, that didn't work. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2">
            <Sparkles className="size-3" />
            Internal · Manny&rsquo;s desk
          </Badge>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Today&rsquo;s queue.
          </h1>
          <p className="mt-1 text-sm text-muted sm:text-base">
            Tap a job for full details, then confirm or decline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Stat label="Pending" value={counts.pending ?? 0} variant="brand" />
          <Stat label="Upcoming" value={counts.confirmed ?? 0} />
          <Stat label="Today" value={countToday(initialBookings)} />
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-1 rounded-full border border-rule bg-paper p-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-ring",
                active ? "bg-ink text-paper" : "text-muted hover:text-ink"
              )}
            >
              {t.label}
              {counts[t.id] !== undefined && (
                <span
                  className={cn(
                    "ml-2 inline-flex min-w-[20px] justify-center rounded-full px-1.5 text-[11px] font-mono",
                    active
                      ? "bg-paper/20 text-paper"
                      : "bg-rule text-muted"
                  )}
                >
                  {counts[t.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-rule">
              <Inbox className="size-5 text-muted" />
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">All clear.</h3>
            <p className="text-sm text-muted">
              No {tab === "all" ? "bookings" : tab + " bookings"} right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              busy={busyId === b.id || pending}
              onConfirm={() => act(b.id, "confirm")}
              onDecline={() => act(b.id, "decline")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "brand";
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border px-3 py-1.5 text-sm",
        variant === "brand"
          ? "border-brand/30 bg-brand-soft text-brand-ink"
          : "border-rule bg-paper text-ink"
      )}
    >
      <span className="font-mono text-base font-semibold">{value}</span>
      <span className="ml-1.5 text-xs text-muted">{label}</span>
    </div>
  );
}

function BookingRow({
  booking,
  busy,
  onConfirm,
  onDecline,
}: {
  booking: Booking;
  busy: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Tappable summary header — taps through to the dedicated mobile detail page. */}
        <Link
          href={`/manny/bookings/${booking.id}`}
          className="flex items-start gap-3 p-5 active:bg-rule/30 lg:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} />
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                #{booking.id.slice(0, 8)}
              </span>
              <span className="ml-auto font-display text-lg font-semibold text-ink">
                {formatPriceFromDollars(booking.priceDollars)}
              </span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-ink">
              {booking.serviceName}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatWhen(booking.scheduledStart, booking.scheduledEnd)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {booking.durationMinutes} min
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-ink">
              <span className="font-medium">{booking.customer.name}</span>
              <span className="text-muted">· {booking.address.borough}</span>
              {booking.photos.length > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-rule bg-background/60 px-2 py-0.5 text-xs text-muted">
                  <ImageIcon className="size-3" />
                  {booking.photos.length}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="mt-1 size-5 shrink-0 text-muted-soft lg:mt-0" />
        </Link>

        {/* Quick actions — tap targets sized for thumbs. */}
        <div className="flex border-t border-rule">
          <a
            href={telUrl(booking.customer.phone)}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 border-r border-rule text-sm font-medium text-ink active:bg-rule/40"
          >
            <Phone className="size-4" />
            Call
          </a>
          <a
            href={smsUrl(booking.customer.phone)}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 border-r border-rule text-sm font-medium text-ink active:bg-rule/40"
          >
            <MessageSquare className="size-4" />
            Text
          </a>
          {booking.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={onDecline}
                disabled={busy}
                className="flex h-12 flex-1 items-center justify-center gap-1.5 border-r border-rule text-sm font-medium text-ink active:bg-rule/40 disabled:opacity-50"
              >
                <X className="size-4" />
                Decline
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="flex h-12 flex-[1.3] items-center justify-center gap-1.5 bg-brand text-sm font-semibold text-paper active:translate-y-px disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                Confirm
              </button>
            </>
          ) : (
            <span className="flex h-12 flex-[2] items-center justify-center text-xs text-muted">
              Updated {new Date(booking.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, { label: string; variant: "default" | "brand" | "trust" | "ink" }> = {
    pending: { label: "Awaiting confirm", variant: "brand" },
    confirmed: { label: "Confirmed", variant: "trust" },
    declined: { label: "Declined", variant: "default" },
    completed: { label: "Completed", variant: "ink" },
    canceled: { label: "Canceled", variant: "default" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatWhen(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const dateStr = s.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const t1 = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const t2 = e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${t1} – ${t2}`;
}

function countToday(bookings: Booking[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return bookings.filter(
    (b) => b.scheduledStart.startsWith(today) && b.status !== "declined" && b.status !== "canceled"
  ).length;
}
