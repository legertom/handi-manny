import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SERVICES } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPriceFromDollars } from "@/lib/utils";
import { Clock, ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { getUpcomingAvailability } from "@/lib/availability";

export const metadata: Metadata = {
  title: "Services & pricing",
  description:
    "Flat-rate pricing on TV mounts, AC installs, IKEA assembly, faucets, wall repair, and time blocks. Real prices, no hidden fees.",
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
      {/* Static shell — prerendered at build time, instant from CDN */}
      <div className="max-w-3xl">
        <Badge className="mb-3">Services & pricing</Badge>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Real prices. No hidden fees.
        </h1>
        <p className="mt-4 text-lg text-muted">
          We&rsquo;d rather quote it honestly than bait-and-switch. Flat rates cover
          the typical job; the page for each service lists what&rsquo;s included and
          what costs extra.
        </p>
      </div>

      {/* Cached catalog — revalidates hourly, served from cache between */}
      <CachedServiceCatalog />

      {/* Dynamic availability — streams in fresh per-request */}
      <section className="mt-16">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Next available
          </h2>
          <p className="mt-1 text-sm text-muted">
            Live availability for the next 3 days.
          </p>
        </div>
        <Suspense fallback={<AvailabilitySkeleton />}>
          <LiveAvailability />
        </Suspense>
      </section>
    </div>
  );
}

async function CachedServiceCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag("service-catalog");

  const flat = SERVICES.filter((s) => s.category === "flat");
  const blocks = SERVICES.filter((s) => s.category === "block");
  const hourly = SERVICES.filter((s) => s.category === "hourly");

  return (
    <>
      <Section title="Flat-rate jobs" subtitle="Book it, done in one visit.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flat.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </Section>

      <Section title="Time blocks" subtitle="Mixed punch lists, knocked out in one go.">
        <div className="grid gap-4 lg:grid-cols-2">
          {blocks.map((s) => (
            <ServiceCard key={s.id} service={s} large />
          ))}
        </div>
      </Section>

      <Section title="Hourly" subtitle="When the job doesn't fit a flat rate.">
        <div className="grid gap-4 lg:grid-cols-2">
          {hourly.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </Section>
    </>
  );
}

async function LiveAvailability() {
  await connection();
  const popular = SERVICES.filter((s) => s.popular);
  const availability = popular.map((service) => ({
    service,
    days: getUpcomingAvailability(service.durationMinutes, 3),
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {availability.map(({ service, days }) => {
        const totalSlots = days.reduce((sum, d) => sum + d.slots.length, 0);
        return (
          <Card key={service.id}>
            <CardContent className="p-5">
              <h3 className="font-display text-base font-bold text-ink">
                {service.name}
              </h3>
              <div className="mt-3 space-y-2">
                {days.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted">
                      {day.weekday} {day.day}
                    </span>
                    <span
                      className={
                        day.slots.length > 3
                          ? "font-medium text-trust"
                          : day.slots.length > 0
                            ? "text-brand"
                            : "text-muted-soft"
                      }
                    >
                      {day.slots.length === 0
                        ? "Full"
                        : `${day.slots.length} slots`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-rule pt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <CalendarDays className="size-3.5" />
                  {totalSlots} total openings
                </span>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/book?service=${service.id}`}>
                    Book <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function AvailabilitySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="flex h-48 items-center justify-center p-5">
            <Loader2 className="size-5 animate-spin text-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ServiceCard({
  service,
  large = false,
}: {
  service: (typeof SERVICES)[number];
  large?: boolean;
}) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group focus-ring rounded-[14px]"
    >
      <Card className="h-full transition-all group-hover:border-rule-strong group-hover:shadow-[0_2px_0_rgba(15,23,42,0.04),0_16px_32px_-16px_rgba(15,23,42,0.16)]">
        <CardContent className={large ? "p-7" : "p-6"}>
          <div className="flex items-start justify-between">
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">
              {service.name}
            </h3>
            {service.popular && <Badge variant="brand">Popular</Badge>}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {service.blurb}
          </p>
          <div className="mt-5 flex items-baseline gap-3 border-t border-rule pt-4">
            <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
              {formatPriceFromDollars(service.priceDollars)}
            </span>
            <span className="text-sm text-muted">
              {service.category === "hourly" ? "/ hour" : "flat"}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
              <Clock className="size-3.5" />
              {formatDuration(service.durationMinutes)}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-brand opacity-0 transition-opacity group-hover:opacity-100">
              See details →
            </span>
            <Button asChild variant="ghost" size="sm" className="ml-auto">
              <span className="pointer-events-none">
                Book <ArrowRight className="size-3.5" />
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h}h ${m}m`;
}
