"use client";

import { useMemo } from "react";
import { ArrowLeft, ArrowRight, AlertCircle, Plus, Check } from "lucide-react";
import type { Service } from "@/lib/services";
import type { BookingPhoto } from "@/lib/store";
import {
  getIntake,
  validateIntake,
  computeBreakdown,
  type IntakeAnswers,
  type Question,
  type Addon,
} from "@/lib/intake";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { PhotoUploader } from "./photo-uploader";
import { cn, formatPriceFromDollars } from "@/lib/utils";

export function IntakeStep({
  service,
  answers,
  onAnswers,
  selectedAddonIds,
  onAddons,
  taskDetails,
  onDetails,
  photos,
  onPhotos,
  onBack,
  onContinue,
}: {
  service: Service;
  answers: IntakeAnswers;
  onAnswers: (next: IntakeAnswers) => void;
  selectedAddonIds: string[];
  onAddons: (next: string[]) => void;
  taskDetails: string;
  onDetails: (v: string) => void;
  photos: BookingPhoto[];
  onPhotos: (next: BookingPhoto[]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const intake = getIntake(service.id);
  const validation = useMemo(
    () => validateIntake(service, answers, selectedAddonIds),
    [service, answers, selectedAddonIds]
  );
  const breakdown = useMemo(
    () => computeBreakdown(service, answers, selectedAddonIds),
    [service, answers, selectedAddonIds]
  );

  // Hard-block warning (e.g., AC > 14K BTU): pulled from the validation result.
  const hardBlock = !validation.ok && validation.hardBlock;
  // Soft warnings: any selected option that has `warn` text but isn't excluding.
  const softWarnings = collectSoftWarnings(intake, answers);

  function setAnswer(qid: string, value: string | string[] | undefined) {
    onAnswers({ ...answers, [qid]: value });
  }

  function toggleAddon(id: string) {
    onAddons(
      selectedAddonIds.includes(id)
        ? selectedAddonIds.filter((x) => x !== id)
        : [...selectedAddonIds, id]
    );
  }

  return (
    <div>
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Tell us about the {service.name.toLowerCase()}.
        </h1>
        {intake.intro && <p className="mt-2 text-muted">{intake.intro}</p>}
      </header>

      {/* Questions */}
      {intake.questions.length > 0 && (
        <section className="mt-8 space-y-7">
          {intake.questions.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={(v) => setAnswer(q.id, v)}
            />
          ))}
        </section>
      )}

      {/* Soft warnings */}
      {softWarnings.length > 0 && !hardBlock && (
        <div className="mt-6 space-y-2">
          {softWarnings.map((w, i) => (
            <p
              key={i}
              className="flex items-start gap-2 rounded-[10px] border border-warning/30 bg-warning/5 p-3 text-xs text-warning"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Hard block */}
      {hardBlock && (
        <div className="mt-6 rounded-[14px] border border-warning/40 bg-warning/5 p-5">
          <div className="flex items-start gap-2.5 text-warning">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-display text-base font-semibold">
                We can&rsquo;t take this one.
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {validation.reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add-ons */}
      {intake.addons.length > 0 && !hardBlock && (
        <section className="mt-12">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-ink">
              Add to your visit
            </h2>
            <p className="mt-1 text-sm text-muted">
              Optional. Manny brings these so you don&rsquo;t have to source them.
            </p>
          </div>
          <ul className="mt-4 space-y-2.5">
            {intake.addons.map((a) => (
              <AddonCard
                key={a.id}
                addon={a}
                selected={selectedAddonIds.includes(a.id)}
                onToggle={() => toggleAddon(a.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Photos */}
      {!hardBlock && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold tracking-tight text-ink">
            Photos
          </h2>
          <p className="mt-1 text-sm text-muted">
            A photo of your wall, AC unit, or the IKEA box saves a lot of back-and-forth.
            Tap “Take photo” to use your camera.
          </p>
          <div className="mt-3">
            <PhotoUploader photos={photos} onChange={onPhotos} />
          </div>
        </section>
      )}

      {/* Free-form notes */}
      {!hardBlock && (
        <section className="mt-12">
          <Label htmlFor="task-details">Anything else we should know? (optional)</Label>
          <Textarea
            id="task-details"
            placeholder="e.g., walk-up, doorman, parking is brutal — there's a spot on 7th Ave."
            value={taskDetails}
            onChange={(e) => onDetails(e.target.value)}
          />
        </section>
      )}

      {/* Mobile sticky CTA + desktop nav */}
      <div className="mt-12 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button onClick={onContinue} disabled={!validation.ok}>
          Continue · {formatPriceFromDollars(breakdown.totalDollars)}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Question fields ---------------- */

function QuestionField({
  question: q,
  value,
  onChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  onChange: (v: string | string[] | undefined) => void;
}) {
  if (q.type === "selectOne") {
    return (
      <fieldset>
        <legend className="block text-sm font-medium text-ink-soft">
          {q.label}{" "}
          {q.required && <span className="text-muted-soft">·</span>}
        </legend>
        {q.helper && (
          <p className="mt-1 text-xs text-muted">{q.helper}</p>
        )}
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={cn(
                  "flex items-start gap-2.5 rounded-[12px] border p-3.5 text-left transition-colors focus-ring active:translate-y-px",
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-rule bg-paper text-ink hover:border-rule-strong",
                  opt.excludes && active && "border-warning bg-warning/10 text-ink"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                    active
                      ? "border-paper bg-paper"
                      : "border-rule-strong bg-paper"
                  )}
                >
                  {active && (
                    <span className="size-2 rounded-full bg-ink" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{opt.label}</span>
                    {opt.priceDelta != null && opt.priceDelta !== 0 && (
                      <span
                        className={cn(
                          "shrink-0 font-mono text-xs",
                          active ? "text-paper/70" : "text-brand-ink"
                        )}
                      >
                        +{formatPriceFromDollars(opt.priceDelta)}
                      </span>
                    )}
                  </span>
                  {opt.description && (
                    <span
                      className={cn(
                        "mt-0.5 block text-xs",
                        active ? "text-paper/70" : "text-muted"
                      )}
                    >
                      {opt.description}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (q.type === "selectMany") {
    const arr = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        <legend className="block text-sm font-medium text-ink-soft">
          {q.label}
        </legend>
        {q.helper && <p className="mt-1 text-xs text-muted">{q.helper}</p>}
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt) => {
            const active = arr.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(
                    active ? arr.filter((x) => x !== opt.value) : [...arr, opt.value]
                  );
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-[12px] border p-3.5 text-left transition-colors focus-ring active:translate-y-px",
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-rule bg-paper text-ink hover:border-rule-strong"
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded border",
                    active ? "border-paper bg-paper text-ink" : "border-rule-strong bg-paper"
                  )}
                >
                  {active && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">{opt.label}</span>
                {opt.priceDelta ? (
                  <span
                    className={cn(
                      "shrink-0 font-mono text-xs",
                      active ? "text-paper/70" : "text-brand-ink"
                    )}
                  >
                    +{formatPriceFromDollars(opt.priceDelta)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  // text
  return (
    <div>
      <Label htmlFor={q.id}>
        {q.label} {q.required && <span className="text-muted-soft">·</span>}
      </Label>
      {q.helper && <p className="-mt-1 mb-1.5 text-xs text-muted">{q.helper}</p>}
      {q.multiline ? (
        <Textarea
          id={q.id}
          placeholder={q.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px]"
        />
      ) : (
        <Input
          id={q.id}
          placeholder={q.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/* ---------------- Add-on card ---------------- */

function AddonCard({
  addon,
  selected,
  onToggle,
}: {
  addon: Addon;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={cn(
          "group flex w-full items-start gap-3 rounded-[14px] border p-4 text-left transition-colors focus-ring active:translate-y-px",
          selected
            ? "border-brand bg-brand-soft/60 text-ink"
            : "border-rule bg-paper text-ink hover:border-rule-strong"
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border",
            selected
              ? "border-brand bg-brand text-paper"
              : "border-rule-strong bg-paper text-muted group-hover:text-ink"
          )}
        >
          {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-display text-base font-semibold tracking-tight">
              {addon.label}
            </span>
            <span className="shrink-0 font-mono text-sm text-brand-ink">
              +{formatPriceFromDollars(addon.priceDelta)}
            </span>
          </span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted">
            {addon.blurb}
            {addon.durationDelta ? (
              <span className="ml-1 text-xs text-muted-soft">
                · adds ~{addon.durationDelta} min
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

/* ---------------- helpers ---------------- */

function collectSoftWarnings(
  intake: ReturnType<typeof getIntake>,
  answers: IntakeAnswers
): string[] {
  const out: string[] = [];
  for (const q of intake.questions) {
    if (q.type === "selectOne") {
      const v = answers[q.id];
      if (typeof v === "string") {
        const opt = q.options.find((o) => o.value === v);
        if (opt?.warn && !opt.excludes) out.push(opt.warn);
      }
    }
  }
  return out;
}
