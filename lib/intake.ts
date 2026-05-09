// Per-service intake forms: questions, add-ons, pricing & duration adjustments.
//
// Pricing model:
//   total price    = service.priceDollars + sum(question option priceDelta) + sum(addon priceDelta)
//   total duration = service.durationMinutes + sum(addon durationDelta)
//
// Hard-block logic: a selected option with `excludes: true` blocks Continue and
// shows a friendly "we can't do this" warning so we route the customer to a
// licensed specialist.

import type { Service } from "./services";

export type SelectOption = {
  value: string;
  label: string;
  /** Short paragraph shown under the label. */
  description?: string;
  /** Dollar adjustment to the total when this option is selected. */
  priceDelta?: number;
  /** Warning copy shown beneath the question when this option is selected. */
  warn?: string;
  /** If true, prevents the user from continuing — for jobs we can't take. */
  excludes?: boolean;
};

export type Question =
  | {
      type: "selectOne";
      id: string;
      label: string;
      helper?: string;
      required?: boolean;
      options: SelectOption[];
    }
  | {
      type: "selectMany";
      id: string;
      label: string;
      helper?: string;
      options: SelectOption[];
    }
  | {
      type: "text";
      id: string;
      label: string;
      helper?: string;
      placeholder?: string;
      required?: boolean;
      multiline?: boolean;
    };

export type Addon = {
  id: string;
  label: string;
  blurb: string;
  priceDelta: number;
  durationDelta?: number;
};

export type ServiceIntake = {
  intro?: string;
  questions: Question[];
  addons: Addon[];
};

/** Intake answers as stored on the booking. */
export type IntakeAnswers = Record<string, string | string[] | undefined>;

export type PriceLineItem = {
  label: string;
  dollars: number;
};

export type PriceBreakdown = {
  baseDollars: number;
  items: PriceLineItem[];
  totalDollars: number;
  totalMinutes: number;
};

/* ============================================================================
   Per-service intakes
   ============================================================================ */

export const INTAKES: Record<string, ServiceIntake> = {
  "tv-mount": {
    intro: "A few quick details so Manny shows up with the right hardware.",
    questions: [
      {
        type: "selectOne",
        id: "tvSize",
        label: "TV size",
        required: true,
        options: [
          { value: "lt-55", label: "Up to 55″" },
          { value: "55-65", label: "55–65″" },
          { value: "65-plus", label: "Over 65″", priceDelta: 40 },
        ],
      },
      {
        type: "selectOne",
        id: "wallMaterial",
        label: "Wall material",
        required: true,
        options: [
          { value: "drywall", label: "Drywall (most apartments)" },
          { value: "brick", label: "Brick / masonry" },
          { value: "plaster", label: "Plaster (prewar)" },
          { value: "unsure", label: "Not sure", description: "Manny will check on arrival" },
        ],
      },
      {
        type: "selectOne",
        id: "mountType",
        label: "Mount style",
        required: true,
        options: [
          { value: "fixed", label: "Flat / fixed" },
          { value: "tilt", label: "Tilting" },
          { value: "full-motion", label: "Full-motion / articulating" },
        ],
      },
    ],
    addons: [
      {
        id: "in-wall-cables",
        label: "In-wall cable concealment",
        blurb: "Cables run inside the wall instead of a surface channel",
        priceDelta: 80,
        durationDelta: 30,
      },
      {
        id: "mount-hardware",
        label: "Mount + hardware",
        blurb: "Manny brings the mount kit, sized to your TV",
        priceDelta: 35,
      },
    ],
  },

  "ac-install": {
    intro: "AC units are picky. These answers help us plan and bring the right parts.",
    questions: [
      {
        type: "selectOne",
        id: "btu",
        label: "Unit BTU rating",
        helper: "Look on the box or the unit's spec sticker.",
        required: true,
        options: [
          { value: "lt-8k", label: "Under 8,000 BTU" },
          { value: "8-12k", label: "8,000 – 12,000 BTU" },
          {
            value: "12-14k",
            label: "12,000 – 14,000 BTU",
            priceDelta: 50,
            warn: "Heavier units need extra bracing — adds $50.",
          },
          {
            value: "gt-14k",
            label: "Over 14,000 BTU",
            excludes: true,
            warn:
              "Units above 14,000 BTU need a permitted install. We can't safely do these — we'd recommend a licensed HVAC tech.",
          },
        ],
      },
      {
        type: "selectOne",
        id: "windowType",
        label: "Window type",
        required: true,
        options: [
          { value: "double-hung", label: "Standard double-hung" },
          { value: "casement", label: "Casement / crank-out" },
          { value: "slider", label: "Sliding window" },
          { value: "unsure", label: "Not sure" },
        ],
      },
      {
        type: "selectOne",
        id: "bracket",
        label: "Do you have a window bracket?",
        helper: "Most NYC buildings now require one for safety.",
        required: true,
        options: [
          { value: "yes-installed", label: "Yes, already installed" },
          { value: "yes-not-installed", label: "I have one, not installed yet" },
          { value: "no", label: "I don't have one" },
        ],
      },
      {
        type: "selectOne",
        id: "remove-existing",
        label: "Existing AC to remove?",
        options: [
          { value: "no", label: "No" },
          {
            value: "yes",
            label: "Yes — please remove and dispose",
            priceDelta: 40,
          },
        ],
      },
    ],
    addons: [
      {
        id: "bracket",
        label: "Bring a window bracket",
        blurb: "Code-compliant universal bracket — Manny brings it and installs",
        priceDelta: 50,
        durationDelta: 15,
      },
      {
        id: "weather-strip",
        label: "Re-seal + weather-strip",
        blurb: "Foam side panels + perimeter sealing for max efficiency",
        priceDelta: 25,
      },
    ],
  },

  "ikea-small": {
    intro: "Tell us what we're building.",
    questions: [
      {
        type: "text",
        id: "model",
        label: "IKEA model name(s)",
        placeholder: "e.g., MALM 3-drawer, BESTÅ wall shelf",
        required: true,
      },
      {
        type: "selectOne",
        id: "parts-check",
        label: "Have you opened the box and confirmed all parts are there?",
        required: true,
        options: [
          { value: "yes", label: "Yes, all parts confirmed" },
          {
            value: "no",
            label: "Haven't checked",
            description: "Manny will verify before starting",
          },
        ],
      },
    ],
    addons: [],
  },

  "ikea-medium": {
    intro: "Tell us what we're building.",
    questions: [
      {
        type: "text",
        id: "model",
        label: "IKEA model name(s)",
        placeholder: "e.g., MALM bed, BESTÅ TV unit",
        required: true,
      },
      {
        type: "selectOne",
        id: "wall-place",
        label: "Where's it going?",
        options: [
          { value: "open", label: "Plenty of space to lay parts out" },
          {
            value: "tight",
            label: "Tight space — needs to be assembled near final spot",
          },
        ],
      },
    ],
    addons: [],
  },

  "ikea-large": {
    intro: "Big builds — wall anchoring is included for tip-prone furniture.",
    questions: [
      {
        type: "text",
        id: "model",
        label: "IKEA model name(s)",
        placeholder: "e.g., PAX 75″ wardrobe, KALLAX 5×5",
        required: true,
      },
      {
        type: "selectOne",
        id: "wall-material",
        label: "Wall material (for anchoring)",
        required: true,
        options: [
          { value: "drywall", label: "Drywall" },
          { value: "brick", label: "Brick / masonry" },
          { value: "plaster", label: "Plaster (prewar)" },
        ],
      },
    ],
    addons: [
      {
        id: "heavy-anchors",
        label: "Heavy-duty toggle anchors",
        blurb: "Stronger anchors for plaster or brick walls",
        priceDelta: 20,
      },
    ],
  },

  "faucet-swap": {
    intro:
      "We do like-for-like swaps using your existing supply lines and shutoff valves.",
    questions: [
      {
        type: "selectOne",
        id: "location",
        label: "Which faucet?",
        required: true,
        options: [
          { value: "kitchen", label: "Kitchen sink" },
          { value: "bath", label: "Bathroom sink" },
        ],
      },
      {
        type: "selectOne",
        id: "shutoff-works",
        label: "Do the under-sink shutoff valves work?",
        helper: "Twist them. Water should stop. If they're stuck or weeping, we need a plumber.",
        required: true,
        options: [
          { value: "yes", label: "Yes, they shut off cleanly" },
          {
            value: "no",
            label: "No / stuck",
            excludes: true,
            warn:
              "Seized shutoffs require a licensed plumber. We can't safely do this — we'd refer you to one.",
          },
          {
            value: "unsure",
            label: "Not sure",
            description: "Manny will check before starting",
          },
        ],
      },
      {
        type: "text",
        id: "faucet-brand",
        label: "Faucet brand & model (if known)",
        placeholder: "e.g., Moen Arbor 7594",
      },
    ],
    addons: [
      {
        id: "new-supply-lines",
        label: "New supply lines",
        blurb: "Braided stainless 20″ supply lines (hot + cold)",
        priceDelta: 25,
      },
    ],
  },

  "wall-repair": {
    intro: "We patch and sand to primer-ready. Paint match is a separate add-on.",
    questions: [
      {
        type: "selectOne",
        id: "hole-count",
        label: "Number of patches",
        required: true,
        options: [
          { value: "1", label: "1 patch" },
          { value: "2-4", label: "2–4 patches", priceDelta: 40 },
          { value: "5-8", label: "5–8 patches", priceDelta: 120 },
          { value: "9-plus", label: "9 or more", priceDelta: 200 },
        ],
      },
      {
        type: "selectOne",
        id: "max-size",
        label: "Largest hole size",
        options: [
          { value: "anchor", label: "Anchor / nail hole" },
          { value: "fist", label: "Up to fist-sized" },
          {
            value: "large",
            label: "Larger than a fist",
            priceDelta: 60,
            warn: "Large holes need a backing patch — we'll review your photos before arrival.",
          },
        ],
      },
    ],
    addons: [
      {
        id: "primer",
        label: "Apply primer coat",
        blurb: "Skip the wait — paint as soon as we're done",
        priceDelta: 25,
      },
      {
        id: "paint-match",
        label: "Paint match (one wall)",
        blurb: "Manny brings a sample card and matched touch-up",
        priceDelta: 40,
        durationDelta: 30,
      },
    ],
  },

  hanging: {
    intro: "We use the right anchor for your wall — toggle, molly, or stud.",
    questions: [
      {
        type: "selectOne",
        id: "item-count",
        label: "Number of items",
        required: true,
        options: [
          { value: "1-3", label: "1–3 items" },
          { value: "4-5", label: "4–5 items" },
          { value: "6-10", label: "6–10 items", priceDelta: 60 },
          {
            value: "10-plus",
            label: "More than 10",
            description: "A Half-Day Block is a better value at this point",
          },
        ],
      },
      {
        type: "selectMany",
        id: "item-types",
        label: "What are we hanging?",
        options: [
          { value: "art", label: "Framed art" },
          { value: "shelves", label: "Shelves" },
          { value: "mirror", label: "Mirror" },
          { value: "curtain", label: "Curtain rods" },
          { value: "small-tv", label: "Small TV (no stud)" },
          { value: "other", label: "Something else" },
        ],
      },
      {
        type: "selectOne",
        id: "wall-types",
        label: "Wall material(s)",
        options: [
          { value: "drywall", label: "Drywall" },
          { value: "brick", label: "Brick / masonry" },
          { value: "plaster", label: "Plaster (prewar)" },
          { value: "mixed", label: "Mix of materials" },
        ],
      },
    ],
    addons: [],
  },

  "block-half": {
    intro: "Send us your punch list — we'll plan the visit before arrival.",
    questions: [
      {
        type: "text",
        id: "punchlist",
        label: "Your punch list",
        helper: "One task per line works well.",
        placeholder:
          "Mount 55\" TV in living room\nBuild IKEA MALM dresser\nHang 4 framed prints\nPatch 3 anchor holes\nRe-caulk tub",
        multiline: true,
        required: true,
      },
      {
        type: "selectOne",
        id: "materials",
        label: "Do you have all materials & hardware?",
        required: true,
        options: [
          { value: "yes", label: "Yes, everything's here" },
          {
            value: "partial",
            label: "Partial — I'll list what's missing",
          },
          {
            value: "none",
            label: "No, I need help sourcing",
            description: "Manny will message before the visit to confirm what to bring",
          },
        ],
      },
    ],
    addons: [],
  },

  "block-full": {
    intro: "Send us your punch list — we'll plan the visit before arrival.",
    questions: [
      {
        type: "text",
        id: "punchlist",
        label: "Your punch list",
        helper: "One task per line. We can fit a lot — keep going.",
        multiline: true,
        required: true,
      },
      {
        type: "selectOne",
        id: "materials",
        label: "Do you have all materials & hardware?",
        required: true,
        options: [
          { value: "yes", label: "Yes, everything's here" },
          { value: "partial", label: "Partial" },
          { value: "none", label: "No, I need help sourcing" },
        ],
      },
    ],
    addons: [],
  },

  hourly: {
    intro: "Hourly is best when the job doesn't fit a flat rate.",
    questions: [
      {
        type: "text",
        id: "description",
        label: "Describe the job",
        placeholder: "What do you need done?",
        multiline: true,
        required: true,
      },
      {
        type: "selectOne",
        id: "duration-est",
        label: "Roughly how long do you think it'll take?",
        options: [
          { value: "1", label: "About 1 hour" },
          { value: "2", label: "About 2 hours" },
          {
            value: "3",
            label: "3 hours or more",
            description: "A Half-Day Block at $399 may be a better deal",
          },
        ],
      },
    ],
    addons: [],
  },
};

export function getIntake(serviceId: string): ServiceIntake {
  return INTAKES[serviceId] ?? { questions: [], addons: [] };
}

/* ============================================================================
   Pricing + validation helpers
   ============================================================================ */

export function computeBreakdown(
  service: Service,
  answers: IntakeAnswers,
  addonIds: string[]
): PriceBreakdown {
  const intake = getIntake(service.id);
  const items: PriceLineItem[] = [];
  let totalMinutes = service.durationMinutes;

  // Question-driven deltas.
  for (const q of intake.questions) {
    if (q.type === "selectOne") {
      const v = answers[q.id];
      if (typeof v !== "string") continue;
      const opt = q.options.find((o) => o.value === v);
      if (opt?.priceDelta) items.push({ label: `${q.label}: ${opt.label}`, dollars: opt.priceDelta });
    } else if (q.type === "selectMany") {
      const arr = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
      for (const v of arr) {
        const opt = q.options.find((o) => o.value === v);
        if (opt?.priceDelta) items.push({ label: opt.label, dollars: opt.priceDelta });
      }
    }
  }

  // Add-on deltas.
  for (const id of addonIds) {
    const addon = intake.addons.find((a) => a.id === id);
    if (!addon) continue;
    items.push({ label: addon.label, dollars: addon.priceDelta });
    if (addon.durationDelta) totalMinutes += addon.durationDelta;
  }

  const totalDollars =
    service.priceDollars + items.reduce((s, i) => s + i.dollars, 0);

  return {
    baseDollars: service.priceDollars,
    items,
    totalDollars,
    totalMinutes,
  };
}

export type IntakeValidation =
  | { ok: true }
  | { ok: false; reason: string; hardBlock: boolean };

export function validateIntake(
  service: Service,
  answers: IntakeAnswers,
  addonIds: string[]
): IntakeValidation {
  const intake = getIntake(service.id);

  // Hard-block check on selected options.
  for (const q of intake.questions) {
    if (q.type === "selectOne") {
      const v = answers[q.id];
      if (typeof v === "string") {
        const opt = q.options.find((o) => o.value === v);
        if (opt?.excludes) {
          return {
            ok: false,
            reason: opt.warn ?? "We can't take this job — please call a specialist.",
            hardBlock: true,
          };
        }
      }
    }
  }

  // Required check.
  for (const q of intake.questions) {
    if (q.type === "text" && q.required) {
      const v = answers[q.id];
      if (typeof v !== "string" || v.trim().length === 0) {
        return { ok: false, reason: `${q.label} is required.`, hardBlock: false };
      }
    } else if (q.type === "selectOne" && q.required) {
      const v = answers[q.id];
      if (typeof v !== "string") {
        return { ok: false, reason: `Please answer "${q.label}".`, hardBlock: false };
      }
    }
  }

  // Validate add-on IDs exist.
  for (const id of addonIds) {
    if (!intake.addons.find((a) => a.id === id)) {
      return { ok: false, reason: "Unknown add-on.", hardBlock: false };
    }
  }

  return { ok: true };
}

/** Pretty-print intake answers for the customer/Manny pages. */
export function summarizeIntake(
  serviceId: string,
  answers: IntakeAnswers
): { label: string; value: string }[] {
  const intake = getIntake(serviceId);
  const out: { label: string; value: string }[] = [];
  for (const q of intake.questions) {
    const raw = answers[q.id];
    if (raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0))
      continue;
    if (q.type === "text") {
      out.push({ label: q.label, value: String(raw) });
    } else if (q.type === "selectOne" && typeof raw === "string") {
      const opt = q.options.find((o) => o.value === raw);
      out.push({ label: q.label, value: opt?.label ?? raw });
    } else if (q.type === "selectMany" && Array.isArray(raw)) {
      const labels = raw
        .map((v) => q.options.find((o) => o.value === v)?.label ?? v)
        .join(", ");
      out.push({ label: q.label, value: labels });
    }
  }
  return out;
}
