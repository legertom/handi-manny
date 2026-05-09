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
import { CheckCircle2, Clock, MapPin, CalendarDays, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking received",
  robots: { index: false },
};

export default async function ConfirmationPage({
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
          <span className="text-muted">Manny&rsquo;s reviewing your job.</span>
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
                {service.name}
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

          {(() => {
            const intakeSummary = summarizeIntake(booking.serviceId, booking.intakeAnswers);
            return intakeSummary.length > 0 ? (
              <div className="mt-6 rounded-[10px] border border-rule bg-background/60 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Job details
                </span>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {intakeSummary.map((item) => (
                    <div key={item.label} className="grid grid-cols-[110px_1fr] gap-3">
                      <dt className="text-muted">{item.label}</dt>
                      <dd className="text-ink">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null;
          })()}

          {booking.priceBreakdown.items.length > 0 && (
            <div className="mt-4 rounded-[10px] border border-rule bg-background/60 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Price breakdown
              </span>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted">{booking.serviceName}</span>
                  <span className="text-ink">
                    {formatPriceFromDollars(booking.priceBreakdown.baseDollars)}
                  </span>
                </li>
                {booking.priceBreakdown.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-muted">{item.label}</span>
                    <span className="text-ink">+{formatPriceFromDollars(item.dollars)}</span>
                  </li>
                ))}
                <li className="mt-1 flex justify-between border-t border-rule pt-1.5 font-semibold">
                  <span className="text-ink">Total</span>
                  <span className="text-ink">
                    {formatPriceFromDollars(booking.priceBreakdown.totalDollars)}
                  </span>
                </li>
              </ul>
            </div>
          )}

          {booking.taskDetails && (
            <div className="mt-4 rounded-[10px] border border-rule bg-background/60 p-4 text-sm text-ink-soft">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Your notes
              </span>
              <p className="mt-1">{booking.taskDetails}</p>
            </div>
          )}

          {booking.photos.length > 0 && (
            <div className="mt-6">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Photos you sent
              </span>
              <div className="mt-2">
                <PhotoGallery photos={booking.photos} />
              </div>
            </div>
          )}
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
