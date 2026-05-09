"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Service } from "@/lib/services";
import type { BookingPhoto } from "@/lib/store";
import {
  computeBreakdown,
  summarizeIntake,
  type IntakeAnswers,
  type PriceBreakdown,
} from "@/lib/intake";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { IntakeStep } from "./intake-step";
import { BookingSummary } from "./booking-summary";
import { PhotoGallery } from "@/components/photo-gallery";
import { cn, formatPriceFromDollars } from "@/lib/utils";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Lock,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import type { DayAvailability, Slot } from "@/lib/availability";

const STEPS = ["Service", "Job details", "Time", "Contact", "Review", "Pay"] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

type ContactChannel = "sms" | "email";

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] as const;

export type CartItem = {
  serviceId: string;
  intakeAnswers: IntakeAnswers;
  selectedAddonIds: string[];
  taskDetails: string;
  photos: BookingPhoto[];
};

type Form = {
  items: CartItem[];
  editingIndex: number;
  slot: Slot | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    preferredContact: ContactChannel;
  };
  address: {
    line1: string;
    line2: string;
    city: string;
    borough: (typeof BOROUGHS)[number] | "";
    zip: string;
    accessNotes: string;
  };
};

const EMPTY_CART_ITEM: CartItem = {
  serviceId: "",
  intakeAnswers: {},
  selectedAddonIds: [],
  taskDetails: "",
  photos: [],
};

const EMPTY_FORM: Form = {
  items: [],
  editingIndex: 0,
  slot: null,
  customer: { name: "", email: "", phone: "", preferredContact: "sms" },
  address: { line1: "", line2: "", city: "New York", borough: "", zip: "", accessNotes: "" },
};

export function BookingFlow({
  services,
  initialServiceId,
}: {
  services: Service[];
  initialServiceId?: string;
}) {
  const [step, setStep] = useState<StepIndex>(initialServiceId ? 1 : 0);
  const [form, setForm] = useState<Form>(() => ({
    ...EMPTY_FORM,
    items: initialServiceId
      ? [{ ...EMPTY_CART_ITEM, serviceId: initialServiceId }]
      : [],
  }));
  const [submitting, setSubmitting] = useState(false);

  const currentItem = form.items[form.editingIndex] ?? null;

  const service = useMemo(
    () => (currentItem ? services.find((s) => s.id === currentItem.serviceId) ?? null : null),
    [services, currentItem],
  );

  const itemBreakdowns = useMemo(
    () =>
      form.items.map((item) => {
        const svc = services.find((s) => s.id === item.serviceId);
        return svc ? computeBreakdown(svc, item.intakeAnswers, item.selectedAddonIds) : null;
      }),
    [form.items, services],
  );

  const breakdown = itemBreakdowns[form.editingIndex] ?? null;

  const cartTotal = useMemo(() => {
    let totalDollars = 0;
    let totalMinutes = 0;
    for (const bd of itemBreakdowns) {
      if (bd) {
        totalDollars += bd.totalDollars;
        totalMinutes += bd.totalMinutes;
      }
    }
    return { totalDollars, totalMinutes };
  }, [itemBreakdowns]);

  const router = useRouter();

  function go(next: StepIndex) {
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateCurrentItem(patch: Partial<CartItem>, resetSlot = false) {
    setForm((f) => {
      const items = [...f.items];
      items[f.editingIndex] = { ...items[f.editingIndex], ...patch };
      return { ...f, items, ...(resetSlot ? { slot: null } : {}) };
    });
  }

  function handleServiceSelect(id: string) {
    setForm((f) => {
      const newItem: CartItem = { ...EMPTY_CART_ITEM, serviceId: id };
      if (f.editingIndex < f.items.length) {
        const items = [...f.items];
        items[f.editingIndex] = newItem;
        return { ...f, items, slot: null };
      }
      return { ...f, items: [...f.items, newItem], editingIndex: f.items.length, slot: null };
    });
    go(1);
  }

  function handleAddAnother() {
    setForm((f) => ({ ...f, editingIndex: f.items.length }));
    go(0);
  }

  function handleRemoveItem(index: number) {
    setForm((f) => {
      const items = f.items.filter((_, i) => i !== index);
      const editingIndex = Math.min(f.editingIndex, Math.max(0, items.length - 1));
      return { ...f, items, editingIndex, slot: null };
    });
    if (form.items.length <= 1) go(0);
  }

  function handleEditItem(index: number) {
    setForm((f) => ({ ...f, editingIndex: index }));
    go(1);
  }

  async function submit() {
    if (form.items.length === 0 || !form.slot) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: form.items.map((item) => ({
            serviceId: item.serviceId,
            intakeAnswers: item.intakeAnswers,
            selectedAddonIds: item.selectedAddonIds,
            taskDetails: item.taskDetails,
            photos: item.photos,
          })),
          slot: form.slot,
          customer: form.customer,
          address: form.address,
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      const { id } = (await res.json()) as { id: string };
      router.push(`/book/confirmation/${id}`);
    } catch (err) {
      console.error(err);
      alert("Sorry — something went wrong. Please try again or call (917) 555-0199.");
      setSubmitting(false);
    }
  }

  if (step === 0) {
    const hasCartItems = form.items.length > 0;
    const serviceSelect = (
      <ServiceStep
        services={services}
        selectedId={null}
        onSelect={handleServiceSelect}
      />
    );

    if (!hasCartItems) {
      return (
        <div>
          <Stepper step={step} />
          {serviceSelect}
        </div>
      );
    }

    return (
      <div>
        <Stepper step={step} />
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <CartRibbon
              items={form.items}
              services={services}
              breakdowns={itemBreakdowns}
              cartTotal={cartTotal}
              className="mb-6 lg:hidden"
            />
            {serviceSelect}
          </div>
          <aside className="hidden lg:block">
            <BookingSummary
              cartItems={form.items.map((item, i) => ({
                service: services.find((s) => s.id === item.serviceId)!,
                breakdown: itemBreakdowns[i]!,
              })).filter((x) => x.service && x.breakdown)}
              cartTotal={cartTotal}
              slot={form.slot}
              address={form.address}
              onRemoveItem={handleRemoveItem}
              onEditItem={handleEditItem}
              className="sticky top-24"
            />
          </aside>
        </div>
      </div>
    );
  }

  const cartItemsForDisplay = form.items
    .map((item, i) => ({
      service: services.find((s) => s.id === item.serviceId)!,
      breakdown: itemBreakdowns[i]!,
    }))
    .filter((x) => x.service && x.breakdown);

  return (
    <div>
      <Stepper step={step} />

      {form.items.length > 0 && (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
          {/* Main column */}
          <div className="min-w-0">
            {/* Mobile-only compact ribbon */}
            <CartRibbon
              items={form.items}
              services={services}
              breakdowns={itemBreakdowns}
              cartTotal={cartTotal}
              className="mb-6 lg:hidden"
            />

            {step === 1 && service && currentItem && (
              <IntakeStep
                service={service}
                answers={currentItem.intakeAnswers}
                onAnswers={(intakeAnswers) => updateCurrentItem({ intakeAnswers }, true)}
                selectedAddonIds={currentItem.selectedAddonIds}
                onAddons={(selectedAddonIds) => updateCurrentItem({ selectedAddonIds }, true)}
                taskDetails={currentItem.taskDetails}
                onDetails={(taskDetails) => updateCurrentItem({ taskDetails })}
                photos={currentItem.photos}
                onPhotos={(photos) => updateCurrentItem({ photos })}
                onBack={() => go(0)}
                onContinue={() => go(2)}
                onAddAnother={handleAddAnother}
              />
            )}

            {step === 2 && (
              <SlotStep
                service={service!}
                totalMinutes={cartTotal.totalMinutes}
                selectedSlot={form.slot}
                onSelect={(slot) => setForm((f) => ({ ...f, slot }))}
                onBack={() => go(1)}
                onContinue={() => go(3)}
              />
            )}

            {step === 3 && form.slot && (
              <DetailsStep
                form={form}
                setForm={setForm}
                onBack={() => go(2)}
                onContinue={() => go(4)}
              />
            )}

            {step === 4 && form.slot && (
              <ReviewStep
                items={form.items}
                services={services}
                itemBreakdowns={itemBreakdowns}
                cartTotal={cartTotal}
                form={form}
                onBack={() => go(3)}
                onContinue={() => go(5)}
              />
            )}

            {step === 5 && form.slot && (
              <PaymentStep
                cartTotal={cartTotal}
                submitting={submitting}
                onBack={() => go(4)}
                onSubmit={submit}
              />
            )}
          </div>

          {/* Desktop sticky cart */}
          <aside className="hidden lg:block">
            <BookingSummary
              cartItems={cartItemsForDisplay}
              cartTotal={cartTotal}
              slot={form.slot}
              address={form.address}
              onAddAnother={step <= 1 ? undefined : handleAddAnother}
              onRemoveItem={handleRemoveItem}
              onEditItem={handleEditItem}
              className="sticky top-24"
            />
          </aside>
        </div>
      )}
    </div>
  );
}

/* ---------------- Stepper ---------------- */

function Stepper({ step }: { step: StepIndex }) {
  const total = STEPS.length;
  return (
    <div className="mb-8 sm:mb-10">
      {/* Mobile: compact pill + progress bar. */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs font-medium text-muted">
          <span className="font-mono uppercase tracking-[0.14em]">
            Step {step + 1} of {total}
          </span>
          <span className="text-ink">{STEPS[step]}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-rule">
          <div
            className="h-full bg-ink transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full stepper. */}
      <ol className="hidden flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:flex">
        {STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "current" : "upcoming";
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full border text-xs font-mono transition-colors",
                  state === "done" && "border-trust bg-trust text-paper",
                  state === "current" && "border-ink bg-ink text-paper",
                  state === "upcoming" && "border-rule-strong bg-paper text-muted"
                )}
              >
                {state === "done" ? <CheckCircle2 className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "font-medium",
                  state === "current" ? "text-ink" : "text-muted"
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="text-muted-soft">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------------- Step 1: Service ---------------- */

function ServiceStep({
  services,
  selectedId,
  onSelect,
}: {
  services: Service[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const flat = services.filter((s) => s.category === "flat");
  const block = services.filter((s) => s.category === "block");
  const hourly = services.filter((s) => s.category === "hourly");

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          What needs doing?
        </h1>
        <p className="mt-2 text-muted">
          Pick the closest match. Not sure? <span className="text-ink">Tap “Ask Manny”</span>{" "}
          in the corner and we&rsquo;ll quote it.
        </p>
      </div>

      <ServiceGroup
        title="Flat-rate jobs"
        services={flat}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <ServiceGroup
        title="Time blocks"
        subtitle="Mixed punch lists in one visit."
        services={block}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <ServiceGroup
        title="Hourly"
        subtitle="When the job doesn't fit a flat rate."
        services={hourly}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}

function ServiceGroup({
  title,
  subtitle,
  services,
  selectedId,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  services: Service[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              "group rounded-[14px] border bg-paper p-5 text-left transition-all focus-ring",
              selectedId === s.id
                ? "border-ink ring-2 ring-ink/10"
                : "border-rule hover:border-rule-strong"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                {s.name}
              </h3>
              {s.popular && <Badge variant="brand">Popular</Badge>}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.blurb}</p>
            <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-3">
              <span className="font-display text-xl font-bold text-ink">
                {formatPriceFromDollars(s.priceDollars)}
                <span className="ml-1 text-xs font-normal text-muted">
                  {s.category === "hourly" ? "/ hr" : "flat"}
                </span>
              </span>
              <span className="text-xs text-brand opacity-0 transition-opacity group-hover:opacity-100">
                Pick →
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Step 3: Slot ---------------- */

function SlotStep({
  service,
  totalMinutes,
  selectedSlot,
  onSelect,
  onBack,
  onContinue,
}: {
  service: Service;
  totalMinutes: number;
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/availability?duration=${totalMinutes}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data: { days: DayAvailability[] }) => {
        setDays(data.days);
        const firstWithSlots = data.days.find((d) => d.slots.length > 0);
        setActiveDate(firstWithSlots?.date ?? data.days[0]?.date ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [totalMinutes]);
  // Reference 'service' to keep linter happy; service drives copy elsewhere if extended later.
  void service;

  const activeDay = days.find((d) => d.date === activeDate) ?? null;
  const canContinue = !!selectedSlot;

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Pick a time that works.
      </h1>
      <p className="mt-2 text-muted">
        Times shown are Manny&rsquo;s real availability — already adjusted for any
        add-ons you picked.
      </p>

        <div className="mt-8">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Choose a day
          </h2>
          {loading ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 w-20 shrink-0 animate-pulse rounded-[12px] bg-rule/60"
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((day) => {
                const has = day.slots.length > 0;
                const active = day.date === activeDate;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setActiveDate(day.date)}
                    disabled={!has}
                    className={cn(
                      "flex min-w-[78px] shrink-0 flex-col items-center gap-1 rounded-[12px] border px-3 py-3 transition-all focus-ring",
                      active
                        ? "border-ink bg-ink text-paper"
                        : has
                        ? "border-rule bg-paper text-ink hover:border-rule-strong"
                        : "border-rule/60 bg-paper text-muted-soft cursor-not-allowed"
                    )}
                  >
                    <span className="text-xs uppercase tracking-wider">
                      {day.weekday}
                    </span>
                    <span className="font-display text-xl font-bold">
                      {day.day}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider",
                        active ? "text-paper/60" : "text-muted-soft"
                      )}
                    >
                      {has ? `${day.slots.length} slots` : "Booked"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Available start times
          </h2>
          {activeDay && activeDay.slots.length === 0 && (
            <p className="text-sm text-muted">No slots that day. Try another.</p>
          )}
          {activeDay && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {activeDay.slots.map((slot) => {
                const active = selectedSlot?.start === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => onSelect(slot)}
                    className={cn(
                      "rounded-[10px] border px-3 py-2.5 text-sm font-medium transition-all focus-ring",
                      active
                        ? "border-brand bg-brand text-paper"
                        : "border-rule bg-paper text-ink hover:border-rule-strong"
                    )}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      <div className="mt-10 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button onClick={onContinue} disabled={!canContinue}>
          Continue <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Step 3: Details ---------------- */

function DetailsStep({
  form,
  setForm,
  onBack,
  onContinue,
}: {
  form: Form;
  setForm: React.Dispatch<React.SetStateAction<Form>>;
  onBack: () => void;
  onContinue: () => void;
}) {
  const valid =
    form.customer.name.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(form.customer.email) &&
    form.customer.phone.replace(/\D/g, "").length >= 10 &&
    form.address.line1.trim().length > 2 &&
    !!form.address.borough &&
    /^\d{5}$/.test(form.address.zip);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onContinue();
      }}
    >
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Where and how do we reach you?
      </h1>
      <p className="mt-2 text-muted">
        We&rsquo;ll text or email a confirmation as soon as Manny accepts.
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <fieldset className="contents">
          <div className="sm:col-span-2">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
              About you
            </h2>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              autoComplete="name"
              value={form.customer.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, customer: { ...f.customer, name: e.target.value } }))
              }
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.customer.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, customer: { ...f.customer, email: e.target.value } }))
              }
            />
          </div>
          <div>
            <Label htmlFor="phone">Mobile phone</Label>
            <Input
              id="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="(212) 555-0199"
              value={form.customer.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, customer: { ...f.customer, phone: e.target.value } }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label>How should we reach you?</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["sms", "email"] as ContactChannel[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      customer: { ...f.customer, preferredContact: c },
                    }))
                  }
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-[10px] border px-4 py-3 text-sm font-medium transition-all focus-ring",
                    form.customer.preferredContact === c
                      ? "border-ink bg-ink text-paper"
                      : "border-rule bg-paper text-ink hover:border-rule-strong"
                  )}
                >
                  {c === "sms" ? <Phone className="size-4" /> : <Mail className="size-4" />}
                  {c === "sms" ? "Text me" : "Email me"}
                </button>
              ))}
            </div>
          </div>
        </fieldset>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Job address
          </h2>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="line1">Street address</Label>
          <Input
            id="line1"
            required
            autoComplete="address-line1"
            placeholder="123 Atlantic Ave"
            value={form.address.line1}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: { ...f.address, line1: e.target.value } }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="line2">Apt / floor / buzzer (optional)</Label>
          <Input
            id="line2"
            autoComplete="address-line2"
            placeholder="Apt 4B, buzzer #4B"
            value={form.address.line2}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: { ...f.address, line2: e.target.value } }))
            }
          />
        </div>
        <div>
          <Label htmlFor="borough">Borough</Label>
          <select
            id="borough"
            required
            value={form.address.borough}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                address: { ...f.address, borough: e.target.value as Form["address"]["borough"] },
              }))
            }
            className={cn(
              "flex h-11 w-full rounded-[10px] border border-rule-strong bg-paper px-3 text-base text-ink transition-colors sm:text-[15px]",
              "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
            )}
          >
            <option value="">Select…</option>
            {BOROUGHS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="zip">ZIP</Label>
          <Input
            id="zip"
            required
            inputMode="numeric"
            pattern="\d{5}"
            placeholder="11217"
            value={form.address.zip}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: { ...f.address, zip: e.target.value } }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="access">Building access notes (optional)</Label>
          <Textarea
            id="access"
            placeholder="Walk-up, 4 flights. Doorman will let you up if I'm not home — say my name."
            value={form.address.accessNotes}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: { ...f.address, accessNotes: e.target.value } }))
            }
          />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button type="submit" disabled={!valid}>
          Review <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}

/* ---------------- Step 4: Review ---------------- */

function ReviewStep({
  items,
  services: allServices,
  itemBreakdowns,
  cartTotal,
  form,
  onBack,
  onContinue,
}: {
  items: CartItem[];
  services: Service[];
  itemBreakdowns: (PriceBreakdown | null)[];
  cartTotal: { totalDollars: number; totalMinutes: number };
  form: Form;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        One last look.
      </h1>
      <p className="mt-2 text-muted">
        Make sure everything below is right. Cancellation is free up to 24 hr before.
      </p>

      <div className="mt-8 space-y-4">
        {items.map((item, idx) => {
          const svc = allServices.find((s) => s.id === item.serviceId);
          if (!svc) return null;
          const intakeSummary = summarizeIntake(svc.id, item.intakeAnswers);
          return (
            <ReviewBlock
              key={idx}
              title={items.length > 1 ? `Task ${idx + 1}: ${svc.name}` : "Job details"}
              icon={CheckCircle2}
            >
              {intakeSummary.length > 0 ? (
                intakeSummary.map((si) => (
                  <Row key={si.label} k={si.label} v={si.value} />
                ))
              ) : (
                <Row k="Service" v={svc.name} />
              )}
              {item.taskDetails && <Row k="Notes" v={item.taskDetails} />}
              {item.photos.length > 0 && (
                <div className="px-5 py-3">
                  <span className="block text-sm text-muted">Photos</span>
                  <div className="mt-2">
                    <PhotoGallery photos={item.photos} />
                  </div>
                </div>
              )}
            </ReviewBlock>
          );
        })}

        <ReviewBlock title="When" icon={CalendarDays}>
          <Row k="Date" v={form.slot ? formatDate(form.slot.start) : "—"} />
          <Row k="Time" v={form.slot?.label ?? "—"} />
          <Row k="Estimated duration" v={`${cartTotal.totalMinutes} min`} />
        </ReviewBlock>

        <div className="lg:hidden">
          <ReviewBlock title="Price breakdown" icon={CheckCircle2}>
            {items.map((item, idx) => {
              const svc = allServices.find((s) => s.id === item.serviceId);
              const bd = itemBreakdowns[idx];
              if (!svc || !bd) return null;
              return (
                <div key={idx}>
                  <Row k={svc.name} v={formatPriceFromDollars(bd.baseDollars)} />
                  {bd.items.map((li, i) => (
                    <Row key={i} k={li.label} v={`+${formatPriceFromDollars(li.dollars)}`} />
                  ))}
                </div>
              );
            })}
            <div className="grid grid-cols-[140px_1fr] gap-4 border-t border-rule px-5 py-3 text-sm">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-display text-lg font-semibold text-ink">
                {formatPriceFromDollars(cartTotal.totalDollars)}
              </dd>
            </div>
          </ReviewBlock>
        </div>

        <ReviewBlock title="You" icon={Mail}>
          <Row k="Name" v={form.customer.name} />
          <Row k="Email" v={form.customer.email} />
          <Row k="Phone" v={form.customer.phone} />
          <Row
            k="We'll reach you via"
            v={form.customer.preferredContact === "sms" ? "Text" : "Email"}
          />
        </ReviewBlock>

        <ReviewBlock title="Where" icon={MapPin}>
          <Row
            k="Address"
            v={`${form.address.line1}${form.address.line2 ? ", " + form.address.line2 : ""}`}
          />
          <Row k="Borough" v={`${form.address.borough}, NY ${form.address.zip}`} />
          {form.address.accessNotes && (
            <Row k="Access" v={form.address.accessNotes} />
          )}
        </ReviewBlock>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Edit details
        </Button>
        <Button onClick={onContinue}>
          Continue to payment <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ReviewBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-rule bg-paper">
      <div className="flex items-center gap-2 border-b border-rule px-5 py-3">
        <Icon className="size-4 text-muted" />
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          {title}
        </h3>
      </div>
      <dl className="divide-y divide-rule">{children}</dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 px-5 py-3 text-sm">
      <dt className="text-muted">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}

/* ---------------- Step 5: Payment ---------------- */

function PaymentStep({
  cartTotal,
  submitting,
  onBack,
  onSubmit,
}: {
  cartTotal: { totalDollars: number; totalMinutes: number };
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Card on file.
        <br />
        <span className="text-muted">Charged when Manny is done.</span>
      </h1>
      <p className="mt-2 text-muted">
        We authorize the card now and capture only after the work is completed.
      </p>

      <div className="mt-8 rounded-[14px] border border-rule bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <CreditCard className="size-4" /> Payment details
          </h2>
          <Badge variant="trust">
            <Lock className="size-3" /> Secure
          </Badge>
        </div>

        {/* Stripe Elements goes here once we have keys. Inputs below are placeholders. */}
        <div className="mt-5 space-y-3">
          <div>
            <Label htmlFor="card">Card number</Label>
            <Input
              id="card"
              placeholder="•••• •••• •••• 4242"
              inputMode="numeric"
              aria-disabled
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="exp">Expiration</Label>
              <Input id="exp" placeholder="MM / YY" disabled />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" placeholder="•••" disabled />
            </div>
          </div>
          <p className="rounded-[10px] border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
            Stripe is not connected yet. Submit will create the booking with a
            placeholder authorization for the demo.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-[10px] border border-rule bg-trust-soft/40 p-4 text-sm text-ink-soft">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-trust" />
        <p>
          By booking you authorize a hold of{" "}
          <span className="font-medium text-ink">
            {formatPriceFromDollars(cartTotal.totalDollars)}
          </span>
          . We capture only after Manny confirms and the work is completed.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting
            ? "Booking…"
            : `Confirm booking · ${formatPriceFromDollars(cartTotal.totalDollars)}`}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Mobile cart ribbon (replaces ServiceRibbon for multi-item) ---------------- */

function CartRibbon({
  items,
  services,
  breakdowns,
  cartTotal,
  className,
}: {
  items: CartItem[];
  services: Service[];
  breakdowns: (PriceBreakdown | null)[];
  cartTotal: { totalDollars: number; totalMinutes: number };
  className?: string;
}) {
  return (
    <div className={cn("rounded-[14px] border border-rule bg-paper p-4 sm:p-5", className)}>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        Your cart · {items.length} {items.length === 1 ? "task" : "tasks"}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => {
          const svc = services.find((s) => s.id === item.serviceId);
          const bd = breakdowns[i];
          if (!svc || !bd) return null;
          return (
            <li key={i} className="flex items-baseline justify-between text-sm">
              <span className="truncate text-ink">{svc.name}</span>
              <span className="ml-2 shrink-0 tabular-nums text-muted">
                {formatPriceFromDollars(bd.totalDollars)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-baseline justify-between border-t border-rule pt-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Total · {cartTotal.totalMinutes} min
        </span>
        <span className="font-display text-xl font-extrabold tracking-tight text-ink tabular-nums">
          {formatPriceFromDollars(cartTotal.totalDollars)}
        </span>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
