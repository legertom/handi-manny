import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SERVICES, type Service } from "@/lib/services";
import { TESTIMONIALS, TRUST_STATS } from "@/lib/testimonials";
import { formatPriceFromDollars } from "@/lib/utils";
import {
  Star,
  Clock,
  CheckCircle2,
  Tv,
  Wind,
  Wrench,
  Hammer,
  Frame,
  Calendar,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Sun,
} from "lucide-react";

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "tv-mount": Tv,
  "ac-install": Wind,
  "ikea-medium": Hammer,
  "faucet-swap": Wrench,
  "wall-repair": Hammer,
  hanging: Frame,
};

export default function Home() {
  const featuredFlat = SERVICES.filter((s) =>
    ["tv-mount", "ac-install", "ikea-medium", "faucet-swap", "wall-repair", "hanging"].includes(s.id)
  );
  const block = SERVICES.find((s) => s.id === "block-half")!;

  return (
    <>
      <Hero />
      <TrustBar />
      <Services services={featuredFlat} />
      <BundleSpotlight block={block} />
      <HowItWorks />
      <Reviews />
      <NotForUs />
      <Faq />
      <ClosingCta />
    </>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden brand-band border-b border-rule">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-14 lg:pb-24 lg:pt-20">
        <div>
          <Badge variant="brand" className="mb-5">
            <Sparkles className="size-3.5" />
            5.0 on TaskRabbit · 10 years in NYC
          </Badge>
          <h1 className="text-balance font-display text-[42px] font-black leading-[1.02] tracking-tight text-ink sm:text-[60px] lg:text-[76px]">
            The handyman every NYC apartment{" "}
            <span className="relative inline-block">
              <span className="relative z-10">deserves.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-brand-soft"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            TVs, ACs, IKEA, faucets, wall patches, and the rest of your apartment punch list.
            Booked in 90 seconds, confirmed in under 2 hours, done right the first time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/book">
                Book a job
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">See pricing</Link>
            </Button>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted">
            <MessageCircle className="size-4 text-brand" />
            Or tap <span className="font-medium text-ink">Ask Manny</span> in the corner —
            real quotes, instant.
          </p>
        </div>
        <HeroProof />
      </div>
    </section>
  );
}

function HeroProof() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -left-6 -top-6 hidden h-40 w-40 rounded-full bg-brand/10 blur-3xl lg:block"
      />
      <Card className="relative overflow-hidden">
        <div className="border-b border-rule bg-ink px-6 py-3 text-paper">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-paper/70">
              Today on TaskRabbit
            </span>
            <span className="flex items-center gap-1 text-xs text-paper/80">
              <span className="size-1.5 rounded-full bg-brand animate-pulse" />
              Live
            </span>
          </div>
        </div>
        <CardContent className="p-6 pt-6">
          <div className="flex items-baseline gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-brand text-brand" />
              ))}
            </div>
            <span className="font-display text-2xl font-extrabold text-ink">5.0</span>
            <span className="text-sm text-muted">on TaskRabbit</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {TRUST_STATS.jobsCompleted.toLocaleString()}+ NYC jobs · {TRUST_STATS.yearsExperience} years
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: "On-time arrival", value: "98%" },
              { label: "Repeat customers", value: "62%" },
              { label: "Avg. response", value: "<2 hr" },
              { label: "Cleanup included", value: "Always" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[10px] border border-rule bg-background/60 p-3"
              >
                <div className="font-display text-xl font-bold tracking-tight text-ink">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-xs text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[10px] border border-rule bg-background/60 p-4">
            <p className="text-sm leading-relaxed text-ink-soft">
              <span className="font-medium">&ldquo;Worth every penny.&rdquo;</span>{" "}
              <span className="text-muted">
                Mounted our 65&quot; on brick, routed cables clean. Even cleaned up the dust.
              </span>
            </p>
            <p className="mt-2 text-xs text-muted-soft">— Priya S., Park Slope</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Trust bar ---------------- */

function TrustBar() {
  const items = [
    { icon: Star, label: "5.0 on TaskRabbit" },
    { icon: Clock, label: "Same-day & weekends" },
    { icon: CheckCircle2, label: "Flat-rate pricing" },
    { icon: Sun, label: "10 years in NYC" },
  ];
  return (
    <section className="border-b border-rule bg-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-4 px-5 py-6 sm:grid-cols-4 sm:px-8">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 text-sm text-ink-soft">
            <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand-ink">
              <Icon className="size-4" />
            </span>
            <span className="font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Services grid ---------------- */

function Services({ services }: { services: Service[] }) {
  return (
    <section id="services" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge className="mb-3">Flat-rate jobs</Badge>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            What Manny fixes most.
          </h2>
          <p className="mt-2 max-w-xl text-muted">
            Transparent prices. No hourly surprises. If your job needs a plumber or
            electrician, we&rsquo;ll tell you before you pay.
          </p>
        </div>
        <Link
          href="/services"
          className="text-sm font-medium text-brand hover:underline"
        >
          See all services →
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = SERVICE_ICONS[service.id] ?? Hammer;
          return (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group focus-ring rounded-[14px]"
            >
              <Card className="h-full transition-all group-hover:border-rule-strong group-hover:shadow-[0_2px_0_rgba(15,23,42,0.04),0_16px_32px_-16px_rgba(15,23,42,0.16)]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <span className="grid size-10 place-items-center rounded-[10px] bg-brand-soft text-brand-ink">
                      <Icon className="size-5" />
                    </span>
                    {service.popular && <Badge variant="brand">Popular</Badge>}
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-ink">
                    {service.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {service.blurb}
                  </p>
                  <div className="mt-6 flex items-baseline justify-between border-t border-rule pt-4">
                    <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
                      {formatPriceFromDollars(service.priceDollars)}
                      <span className="ml-1 text-sm font-normal text-muted">flat</span>
                    </span>
                    <span className="text-sm text-brand opacity-0 transition-opacity group-hover:opacity-100">
                      Book →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Bundle Spotlight ---------------- */

function BundleSpotlight({ block }: { block: Service }) {
  return (
    <section className="border-y border-rule bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-24">
        <div>
          <Badge variant="brand" className="mb-5 border-brand bg-brand text-paper">
            <Calendar className="size-3.5" />
            The smartest deal
          </Badge>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-[42px]">
            Half-day block.
            <br />
            <span className="text-brand">{formatPriceFromDollars(block.priceDollars)}</span>{" "}
            <span className="text-paper/70">for 4 hours, mixed tasks.</span>
          </h2>
          <p className="mt-5 max-w-xl text-paper/70">
            Send us your punch list. Manny shows up once and knocks it out — TV mount, art, a
            bookshelf, the squeaky door, the wall patch. Most apartments save ~16% versus
            booking each job separately.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {[
              "Up to ~6 small tasks in one visit",
              "We review your list before arrival",
              "Materials list confirmed in advance",
              "Cleanup always included",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-brand" />
                <span className="text-paper/85">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand hover:bg-brand-hover">
              <Link href="/book?service=block-half">
                Book a half-day
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-paper/20 bg-transparent text-paper hover:bg-paper/10"
            >
              <Link href="/services/full-day-block">Full-day option →</Link>
            </Button>
          </div>
        </div>
        <BlockExample />
      </div>
    </section>
  );
}

function BlockExample() {
  const list = [
    { task: "Mount 55\" TV in living room", mins: 75 },
    { task: "Hang 4 framed prints + mirror", mins: 35 },
    { task: "Build IKEA MALM dresser", mins: 50 },
    { task: "Patch 3 anchor holes, sand", mins: 30 },
    { task: "Re-caulk bathtub", mins: 25 },
    { task: "Travel + setup buffer", mins: 25 },
  ];
  const total = list.reduce((acc, l) => acc + l.mins, 0);
  return (
    <Card className="border-paper/10 bg-paper/[0.04] text-paper backdrop-blur">
      <div className="flex items-center justify-between border-b border-paper/10 px-6 py-3">
        <span className="text-xs uppercase tracking-[0.18em] text-paper/60">
          Sample punch list
        </span>
        <span className="text-xs text-paper/60">240 min budget</span>
      </div>
      <CardContent className="p-6">
        <ul className="divide-y divide-paper/10">
          {list.map((item) => (
            <li key={item.task} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-paper/90">{item.task}</span>
              <span className="font-mono text-xs text-paper/60">{item.mins}m</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between rounded-[10px] bg-paper/5 px-3 py-2.5">
          <span className="text-sm text-paper/80">Total</span>
          <span className="font-mono text-sm text-paper">
            {total} min · all-in $399
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- How It Works ---------------- */

function HowItWorks() {
  const steps = [
    {
      title: "Tell us what you need",
      body:
        "Pick a service or chat with our AI assistant. Real prices, no surprise fees.",
    },
    {
      title: "Pick a time",
      body:
        "See Manny's actual availability. Same-day slots open most days; we work weekends too.",
    },
    {
      title: "Manny confirms in under 2 hours",
      body:
        "We don't take your money until Manny reviews your job and confirms. You'll get a text or email.",
    },
    {
      title: "Job done, pay only on completion",
      body:
        "We arrive on time, do it right, and clean up. Card on file is charged when the work is finished.",
    },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="max-w-2xl">
        <Badge className="mb-3">How it works</Badge>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Booking that respects your time.
        </h2>
        <p className="mt-2 text-muted">
          You shouldn&rsquo;t have to chase a contractor for a quote. Here&rsquo;s the
          whole flow.
        </p>
      </div>
      <ol className="mt-12 grid gap-px overflow-hidden rounded-[14px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title} className="relative bg-paper p-6">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-brand">
              Step {i + 1}
            </span>
            <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------- Reviews ---------------- */

function Reviews() {
  return (
    <section id="reviews" className="border-y border-rule bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="mb-3">Reviews</Badge>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Five boroughs.
              <br />
              <span className="text-muted">Five stars.</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-brand text-brand" />
              ))}
            </div>
            <span className="font-medium text-ink">5.0</span>
            <span>· {TRUST_STATS.jobsCompleted.toLocaleString()}+ jobs completed</span>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {TESTIMONIALS.slice(0, 6).map((t) => (
            <Card key={t.name + t.date}>
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-brand text-brand" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-soft">
                    {new Date(t.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-soft">
                  &ldquo;{t.body}&rdquo;
                </p>
                <div className="mt-5 border-t border-rule pt-3">
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.neighborhood} · {t.service}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- What we don't do ---------------- */

function NotForUs() {
  const yes = [
    "TV mounting & cable concealment",
    "Window AC installation",
    "IKEA & flat-pack assembly",
    "Faucet swaps (existing supply lines)",
    "Wall repair, drywall patching",
    "Hanging art, shelves, mirrors, curtains",
    "Door & cabinet hardware fixes",
    "Caulking, weather-stripping",
  ];
  const no = [
    "Anything inside the wall (plumbing or electrical)",
    "Permitted electrical work",
    "Gas line work",
    "Major demolition or renovation",
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-2">
        <Card className="bg-trust-soft/40">
          <CardContent className="p-8">
            <h3 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-ink">
              <CheckCircle2 className="size-5 text-trust" />
              What Manny does
            </h3>
            <ul className="mt-5 grid gap-2.5 text-sm text-ink-soft sm:grid-cols-2">
              {yes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-trust" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-8">
            <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              What requires a specialist
            </h3>
            <p className="mt-2 text-sm text-muted">
              We won&rsquo;t touch jobs that legally require a licensed plumber or
              electrician. We&rsquo;d rather refer you out than fake it.
            </p>
            <ul className="mt-5 grid gap-2.5 text-sm text-ink-soft">
              {no.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rule-strong" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

function Faq() {
  const items = [
    {
      q: "What boroughs do you serve?",
      a: "All five — Manhattan, Brooklyn, Queens, Bronx, Staten Island. No travel surcharge for now; outer-borough surcharges may apply on certain weekend slots once we scale.",
    },
    {
      q: "When do I pay?",
      a: "We authorize your card when you book, but we don't charge it until Manny confirms your appointment (usually under 2 hours). If he can't make it work, the hold is released.",
    },
    {
      q: "Cancellation policy?",
      a: "Free cancellation more than 24 hours before your slot. Within 24 hours, we charge 50%. Same-day no-shows are charged in full.",
    },
    {
      q: "Who actually shows up?",
      a: "Manny himself. Same friendly face every visit — no rotating cast of strangers. He's been doing this for 10 years across NYC.",
    },
    {
      q: "What if my job takes longer than expected?",
      a: "Flat-rate jobs stay flat — that's the deal. If we discover something out of scope (rotten studs, the wrong mount, a hidden surprise), we'll stop and quote it before doing extra work.",
    },
    {
      q: "Can you bring materials?",
      a: "We bring all standard hardware and patch compound. For specialty parts (your specific TV mount, faucet, AC bracket) you provide them. The booking flow lists exactly what we cover.",
    },
  ];
  return (
    <section id="faq" className="border-t border-rule bg-paper">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="text-center">
          <Badge className="mb-3">FAQ</Badge>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Honest answers to fair questions.
          </h2>
        </div>
        <div className="mt-12 divide-y divide-rule">
          {items.map((item) => (
            <details
              key={item.q}
              className="group py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
                <span className="font-display text-lg font-medium text-ink">
                  {item.q}
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-rule-strong text-muted transition-transform group-open:rotate-45">
                  <span aria-hidden className="text-xl leading-none">+</span>
                </span>
              </summary>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Closing CTA ---------------- */

function ClosingCta() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
      <div className="relative overflow-hidden rounded-[20px] border border-rule bg-ink p-10 text-paper sm:p-14">
        <div
          aria-hidden
          className="absolute -right-20 -top-20 size-80 rounded-full bg-brand/30 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-[40px]">
            One job. Two hours. Done right.
          </h2>
          <p className="mt-4 text-paper/70">
            Tell Manny what you need. Slot picked, address shared, card on file. We
            confirm fast and we show up.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand hover:bg-brand-hover">
              <Link href="/book">Book a job →</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-paper/20 bg-transparent text-paper hover:bg-paper/10"
            >
              <a href="tel:+19175550199">Call (917) 555-0199</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
