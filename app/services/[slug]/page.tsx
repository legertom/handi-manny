import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES, getServiceBySlug } from "@/lib/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPriceFromDollars } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Clock, ArrowRight, ShieldCheck } from "lucide-react";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: `${service.name} — ${formatPriceFromDollars(service.priceDollars)}`,
    description: service.description,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      <Link
        href="/services"
        className="text-sm text-muted hover:text-ink"
      >
        ← All services
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <div>
          <Badge className="mb-3">
            {service.category === "flat"
              ? "Flat rate"
              : service.category === "block"
              ? "Time block"
              : "Hourly"}
          </Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            {service.name}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            {service.description}
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <CheckCircle2 className="size-4 text-trust" />
                What&rsquo;s included
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                {service.includes.map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-trust" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            {service.excludes && (
              <div>
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <AlertCircle className="size-4 text-warning" />
                  Beyond the flat rate
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                  {service.excludes.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-12 flex items-center gap-3 rounded-[14px] border border-rule bg-trust-soft/40 p-5">
            <ShieldCheck className="size-5 shrink-0 text-trust" />
            <p className="text-sm leading-relaxed text-ink-soft">
              <span className="font-medium">Card on file, charged on completion.</span>{" "}
              We authorize when you book and only capture once Manny has done the work.
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold tracking-tight text-ink">
                  {formatPriceFromDollars(service.priceDollars)}
                </span>
                <span className="text-sm text-muted">
                  {service.category === "hourly" ? "/ hour" : "flat"}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <Clock className="size-3.5" />
                Typical visit · {formatDuration(service.durationMinutes)}
              </p>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link href={`/book?service=${service.id}`}>
                  Book this job
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-soft">
                Free cancellation until 24 hr before
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} minutes`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} ${h === 1 ? "hour" : "hours"}` : `${h}h ${m}m`;
}
