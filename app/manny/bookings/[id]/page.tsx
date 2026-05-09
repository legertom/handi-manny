import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBooking } from "@/lib/store";
import { getServiceById } from "@/lib/services";
import { MannyBookingActions } from "@/components/manny/booking-actions";
import { ClientCopy } from "@/components/manny/client-copy";
import { PhotoGallery } from "@/components/photo-gallery";
import { Badge } from "@/components/ui/badge";
import { fullAddress, mapsUrl, smsUrl, telUrl } from "@/lib/links";
import { summarizeIntake, getIntake } from "@/lib/intake";
import { formatPriceFromDollars } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  Navigation,
  ArrowLeft,
  Image as ImageIcon,
  ListChecks,
  Package,
} from "lucide-react";
import type { Booking } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Job details",
  robots: { index: false },
};

// TODO: gate this page behind auth before launch. Today the URL is shareable by ID;
// production should require a signed token query param OR a logged-in Manny session.

export default async function MannyBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = getBooking(id);
  if (!booking) notFound();
  const service = getServiceById(booking.serviceId);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 pb-32 pt-6 sm:px-6 sm:pt-10">
      <Link
        href="/manny"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Back to queue
      </Link>

      <div className="mt-4">
        <StatusHeader booking={booking} />
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink">
          {service.name}
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-muted">
          #{booking.id.slice(0, 8)} · {formatPriceFromDollars(booking.priceDollars)}
        </p>
      </div>

      {/* When */}
      <Section icon={CalendarDays} label="When">
        <p className="text-lg font-medium text-ink">
          {formatDate(booking.scheduledStart)}
        </p>
        <p className="mt-0.5 text-muted">
          {formatTime(booking.scheduledStart)} – {formatTime(booking.scheduledEnd)}
          <span className="mx-1.5 text-rule-strong">·</span>
          <Clock className="inline size-3.5" /> {booking.durationMinutes} min
        </p>
      </Section>

      {/* Where */}
      <Section icon={MapPin} label="Where">
        <p className="text-base text-ink">
          {booking.address.line1}
          {booking.address.line2 && (
            <>
              <br />
              {booking.address.line2}
            </>
          )}
          <br />
          <span className="text-muted">
            {booking.address.borough}, NY {booking.address.zip}
          </span>
        </p>
        {booking.address.accessNotes && (
          <p className="mt-3 rounded-[10px] border border-rule bg-background/60 p-3 text-sm text-ink-soft">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Access
            </span>
            <br />
            {booking.address.accessNotes}
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <TapAction href={mapsUrl(booking)} icon={Navigation} label="Navigate" />
          <ClientCopy value={fullAddress(booking)} />
        </div>
      </Section>

      {/* Customer + tap actions */}
      <Section icon={Phone} label="Customer">
        <p className="text-lg font-medium text-ink">{booking.customer.name}</p>
        <p className="mt-0.5 text-sm text-muted">
          Prefers{" "}
          <span className="font-medium text-ink-soft">
            {booking.customer.preferredContact === "sms" ? "text" : "email"}
          </span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <TapAction
            href={smsUrl(
              booking.customer.phone,
              `Hey ${booking.customer.name.split(" ")[0]}, this is Manny — just confirming our ${service.name.toLowerCase()} on ${formatShortDate(booking.scheduledStart)} at ${formatTime(booking.scheduledStart)}.`
            )}
            icon={MessageSquare}
            label="Text"
            primary={booking.customer.preferredContact === "sms"}
          />
          <TapAction
            href={telUrl(booking.customer.phone)}
            icon={Phone}
            label="Call"
          />
          <TapAction
            href={`mailto:${booking.customer.email}`}
            icon={Mail}
            label="Email"
            primary={booking.customer.preferredContact === "email"}
          />
        </div>
      </Section>

      {/* Job details from intake — surfaced prominently for prep */}
      <JobIntakeSection booking={booking} />

      {/* Photos */}
      {booking.photos.length > 0 && (
        <Section icon={ImageIcon} label={`Photos · ${booking.photos.length}`}>
          <PhotoGallery photos={booking.photos} />
          <p className="mt-3 text-xs text-muted-soft">
            Tap to view full-size.
          </p>
        </Section>
      )}

      {/* Job notes */}
      {booking.taskDetails && (
        <Section icon={MessageSquare} label="Notes from customer">
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
            {booking.taskDetails}
          </p>
        </Section>
      )}

      {/* Sticky action bar — Manny's primary actions */}
      <MannyBookingActions booking={booking} />
    </div>
  );
}

/* ---------------- Pieces ---------------- */

function Section({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-[14px] border border-rule bg-paper p-5">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <Icon className="size-3.5" />
        {label}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StatusHeader({ booking }: { booking: Booking }) {
  const map: Record<
    Booking["status"],
    { label: string; variant: "default" | "brand" | "trust" | "ink" }
  > = {
    pending: { label: "Awaiting your confirm", variant: "brand" },
    confirmed: { label: "Confirmed", variant: "trust" },
    declined: { label: "Declined", variant: "default" },
    completed: { label: "Completed", variant: "ink" },
    canceled: { label: "Canceled", variant: "default" },
  };
  const s = map[booking.status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function TapAction({
  href,
  icon: Icon,
  label,
  primary,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        primary
          ? "flex h-12 items-center justify-center gap-1.5 rounded-[10px] bg-ink text-paper font-medium text-sm active:translate-y-px"
          : "flex h-12 items-center justify-center gap-1.5 rounded-[10px] border border-rule bg-paper text-ink font-medium text-sm active:translate-y-px"
      }
    >
      <Icon className="size-4" />
      {label}
    </a>
  );
}

function JobIntakeSection({ booking }: { booking: Booking }) {
  const intake = getIntake(booking.serviceId);
  const summary = summarizeIntake(booking.serviceId, booking.intakeAnswers);
  const selectedAddons = intake.addons.filter((a) =>
    booking.selectedAddonIds.includes(a.id)
  );
  const breakdown = booking.priceBreakdown;

  if (
    summary.length === 0 &&
    selectedAddons.length === 0 &&
    breakdown.items.length === 0
  ) {
    return null;
  }

  return (
    <Section icon={ListChecks} label="Job details">
      {summary.length > 0 && (
        <dl className="space-y-2">
          {summary.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[110px_1fr] gap-3 text-sm"
            >
              <dt className="text-muted">{item.label}</dt>
              <dd className="text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {selectedAddons.length > 0 && (
        <div className="mt-4 rounded-[10px] border border-brand/30 bg-brand-soft/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-ink">
            <Package className="size-3.5" />
            You&rsquo;re bringing
          </p>
          <ul className="mt-2 space-y-1.5">
            {selectedAddons.map((a) => (
              <li
                key={a.id}
                className="flex items-baseline justify-between gap-3 text-sm text-ink"
              >
                <span className="font-medium">{a.label}</span>
                <span className="font-mono text-xs text-brand-ink">
                  +{formatPriceFromDollars(a.priceDelta)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.items.length > 0 && (
        <div className="mt-4 rounded-[10px] border border-rule bg-background/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Total breakdown
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">{booking.serviceName}</span>
              <span className="text-ink">
                {formatPriceFromDollars(breakdown.baseDollars)}
              </span>
            </li>
            {breakdown.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span className="text-muted">{item.label}</span>
                <span className="text-ink">+{formatPriceFromDollars(item.dollars)}</span>
              </li>
            ))}
            <li className="mt-1 flex justify-between border-t border-rule pt-1.5 font-semibold">
              <span className="text-ink">Total</span>
              <span className="text-ink">
                {formatPriceFromDollars(breakdown.totalDollars)}
              </span>
            </li>
          </ul>
        </div>
      )}
    </Section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
