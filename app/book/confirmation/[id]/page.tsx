import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBooking } from "@/lib/store";
import { getServiceById } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "@/components/photo-gallery";
import { summarizeIntake } from "@/lib/intake";
import { formatPriceFromDollars } from "@/lib/utils";
import { connection } from "next/server";
import { CheckCircle2, Clock, MapPin, CalendarDays, ArrowRight, Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Booking received",
  robots: { index: false },
};

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted" />
        </div>
      }
    >
      <ConfirmationContent params={params} />
    </Suspense>
  );
}

async function ConfirmationContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const items = booking.items ?? [{
    serviceId: booking.serviceId,
    serviceName: booking.serviceName,
    intakeAnswers: booking.intakeAnswers,
    selectedAddonIds: booking.selectedAddonIds,
    taskDetails: booking.taskDetails,
    photos: booking.photos,
    priceBreakdown: booking.priceBreakdown,
  }];

  const taskCount = items.length;
  const serviceNames = items.map((i) => i.serviceName).join(" + ");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-trust-soft text-trust">
          <CheckCircle2 className="size-7" />
        </span>
        <Badge variant="trust" className="mt-4">
          Booking received
        </Badge>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Thanks{booking.customer.name ? `, ${booking.customer.name.split(" ")[0]}` : ""}.
          <br />
          <span className="text-muted">
            Manny&rsquo;s reviewing your {taskCount > 1 ? `${taskCount} tasks` : "job"}.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-muted">
          You&rsquo;ll get a {booking.customer.preferredContact === "sms" ? "text" : "email"} as
          soon as it&rsquo;s confirmed — usually under 2 hours. Your card is on hold but
          won&rsquo;t be charged until the work is done.
        </p>
      </div>

      <Card className="mt-10">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                Booking #{booking.id.slice(0, 8)}
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
                {serviceNames}
              </h2>
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
              {formatPriceFromDollars(booking.priceDollars)}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Detail icon={CalendarDays} label="When">
              {formatDate(booking.scheduledStart)}
              <br />
              <span className="text-muted">
                {formatTime(booking.scheduledStart)} –{" "}
                {formatTime(booking.scheduledEnd)}
              </span>
            </Detail>
            <Detail icon={Clock} label="Duration">
              {booking.durationMinutes} minutes
            </Detail>
            <Detail icon={MapPin} label="Address">
              {booking.address.line1}
              {booking.address.line2 ? ", " + booking.address.line2 : ""}
              <br />
              <span className="text-muted">
                {booking.address.borough}, NY {booking.address.zip}
              </span>
            </Detail>
            <Detail icon={CheckCircle2} label="Reach you via">
              {booking.customer.preferredContact === "sms"
                ? `Text · ${booking.customer.phone}`
                : `Email · ${booking.customer.email}`}
            </Detail>
          </div>

          {/* Per-item job details */}
          {items.map((item, idx) => {
            const intakeSummary = summarizeIntake(item.serviceId, item.intakeAnswers);
            const hasDetails = intakeSummary.length > 0 || item.taskDetails || (item.photos?.length ?? 0) > 0;
            if (!hasDetails) return null;
            return (
              <div key={idx} className="mt-6 rounded-[10px] border border-rule bg-background/60 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {taskCount > 1 ? `Task ${idx + 1}: ${item.serviceName}` : "Job details"}
                </span>
                {intakeSummary.length > 0 && (
                  <dl className="mt-2 space-y-1.5 text-sm">
                    {intakeSummary.map((si) => (
                      <div key={si.label} className="grid grid-cols-[110px_1fr] gap-3">
                        <dt className="text-muted">{si.label}</dt>
                        <dd className="text-ink">{si.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {item.taskDetails && (
                  <p className="mt-2 text-sm text-ink-soft">{item.taskDetails}</p>
                )}
                {(item.photos?.length ?? 0) > 0 && (
                  <div className="mt-2">
                    <PhotoGallery photos={item.photos} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Price breakdown */}
          <div className="mt-4 rounded-[10px] border border-rule bg-background/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Price breakdown
            </span>
            <ul className="mt-2 space-y-1 text-sm">
              {items.map((item, idx) => (
                <li key={idx}>
                  <div className="flex justify-between">
                    <span className="text-muted">{item.serviceName}</span>
                    <span className="text-ink">
                      {formatPriceFromDollars(item.priceBreakdown.baseDollars)}
                    </span>
                  </div>
                  {item.priceBreakdown.items.map((li, i) => (
                    <div key={i} className="flex justify-between pl-3">
                      <span className="text-muted">{li.label}</span>
                      <span className="text-ink">+{formatPriceFromDollars(li.dollars)}</span>
                    </div>
                  ))}
                </li>
              ))}
              <li className="mt-1 flex justify-between border-t border-rule pt-1.5 font-semibold">
                <span className="text-ink">Total</span>
                <span className="text-ink">
                  {formatPriceFromDollars(booking.priceDollars)}
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild>
          <Link href="/services">
            Add another job <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <p className="mt-10 text-center text-sm text-muted">
        Need help? Call{" "}
        <a href="tel:+19175550199" className="text-ink hover:underline">
          (917) 555-0199
        </a>{" "}
        or email{" "}
        <a href="mailto:hello@handimanny.com" className="text-ink hover:underline">
          hello@handimanny.com
        </a>
      </p>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-rule p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-2 text-sm text-ink">{children}</div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
