export type ServiceCategory = "flat" | "block" | "hourly";

export type Service = {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  /** price in dollars (placeholder amounts) */
  priceDollars: number;
  /** typical duration in minutes used for slot reservation */
  durationMinutes: number;
  blurb: string;
  description: string;
  includes: string[];
  excludes?: string[];
  popular?: boolean;
};

export const SERVICES: Service[] = [
  {
    id: "tv-mount",
    slug: "tv-mounting",
    name: "TV Mounting",
    category: "flat",
    priceDollars: 179,
    durationMinutes: 90,
    blurb: "Drywall, brick, or plaster — mounted level the first time.",
    description:
      "Flat or tilt mount installation for TVs up to 65\". We bring the stud finder, the level, and the patience. Cables tucked into a wire channel, remote tested, you're watching the game in 90 minutes.",
    includes: [
      "Mount installation on drywall, brick, or plaster",
      "Cable concealment with surface-mount channel",
      "Power-up + input source check",
      "All hardware included",
    ],
    excludes: [
      "TVs over 65\" (add $40)",
      "In-wall cable routing (add $80)",
      "Mount hardware not included with TV (add $35)",
    ],
    popular: true,
  },
  {
    id: "ac-install",
    slug: "ac-installation",
    name: "AC Installation",
    category: "flat",
    priceDollars: 149,
    durationMinutes: 75,
    blurb: "Window units installed safely, sealed, and stable.",
    description:
      "Window AC units up to 12,000 BTU. Includes secure bracket or sash-stop installation per NYC building code, foam sealing, and a leak check. We won't install one that doesn't fit your window — we'll tell you before you buy.",
    includes: [
      "Bracket or sash-stop install",
      "Foam side panel sealing",
      "Drainage + tilt check",
      "Power test",
    ],
    excludes: [
      "Units over 12,000 BTU (add $50)",
      "Through-the-wall units (custom quote)",
      "Removing existing AC (add $40)",
    ],
    popular: true,
  },
  {
    id: "ikea-small",
    slug: "ikea-small",
    name: "IKEA Assembly — Small",
    category: "flat",
    priceDollars: 89,
    durationMinutes: 60,
    blurb: "Nightstands, small dressers, simple desks.",
    description:
      "For pieces with under 30 parts and no more than two drawers. We'll have it built, leveled, and the cardboard broken down before you finish the iced coffee.",
    includes: ["Assembly", "Cardboard breakdown", "Hardware check"],
  },
  {
    id: "ikea-medium",
    slug: "ikea-medium",
    name: "IKEA Assembly — Medium",
    category: "flat",
    priceDollars: 149,
    durationMinutes: 105,
    blurb: "Beds, larger desks, 3–4 drawer dressers.",
    description:
      "For mid-sized pieces. Bed frames assembled flat against the wall when space is tight.",
    includes: ["Assembly", "Wall placement", "Cardboard breakdown"],
  },
  {
    id: "ikea-large",
    slug: "ikea-large",
    name: "IKEA Assembly — Large",
    category: "flat",
    priceDollars: 229,
    durationMinutes: 180,
    blurb: "PAX wardrobes, sectionals, KALLAX 5×5+.",
    description:
      "Big builds. We'll wall-anchor wardrobes per IKEA spec — no ifs.",
    includes: ["Assembly", "Wall anchor for tip-prone pieces", "Cardboard breakdown"],
  },
  {
    id: "faucet-swap",
    slug: "faucet-installation",
    name: "Faucet Installation",
    category: "flat",
    priceDollars: 129,
    durationMinutes: 75,
    blurb: "Kitchen or bathroom — like-for-like swap.",
    description:
      "Standard faucet swap with existing supply lines and shutoffs. We don't open walls or replace pipes — that's a plumber's job, and we'll tell you if you need one.",
    includes: ["Faucet removal", "New faucet install", "Leak test"],
    excludes: [
      "New supply lines (add $25 + parts)",
      "Anything requiring a pipe wrench past the shutoff",
    ],
  },
  {
    id: "wall-repair",
    slug: "wall-repair",
    name: "Wall Repair",
    category: "flat",
    priceDollars: 89,
    durationMinutes: 60,
    blurb: "Patch holes, sand smooth, primer-ready.",
    description:
      "First patch is $89, each additional patch in the same visit is $40. We leave it primer-ready — paint match is a separate visit if you want it.",
    includes: ["Drywall patch", "Sanding", "Primer-ready finish"],
    excludes: ["Custom paint match (add $40 per wall)"],
  },
  {
    id: "hanging",
    slug: "art-shelf-hanging",
    name: "Art & Shelf Hanging",
    category: "flat",
    priceDollars: 99,
    durationMinutes: 60,
    blurb: "Up to 5 items, level and secure.",
    description:
      "Pictures, shelves, mirrors, curtain rods. We use the right anchor for the wall — toggle, molly, or stud — not just a nail and a prayer.",
    includes: ["Up to 5 items", "Stud-finder + laser level", "All anchors included"],
  },
  {
    id: "block-half",
    slug: "half-day-block",
    name: "Half-Day Block",
    category: "block",
    priceDollars: 399,
    durationMinutes: 240,
    blurb: "4 hours, mixed tasks. The smartest punch-list deal.",
    description:
      "Knock out a stack of small jobs in one visit — mount the TV, hang the art, fix the squeaky door, build the bookshelf, caulk the tub. About 16% off our hourly rate. Perfect for move-ins.",
    includes: ["4 hours of labor", "Multiple tasks per visit", "Materials list reviewed in advance"],
    popular: true,
  },
  {
    id: "block-full",
    slug: "full-day-block",
    name: "Full-Day Block",
    category: "block",
    priceDollars: 749,
    durationMinutes: 480,
    blurb: "8 hours for renovation punch lists and big move-ins.",
    description:
      "When the list is long. About 21% off our hourly rate. Great for new apartments, post-renovation cleanups, and pre-listing fixes.",
    includes: ["8 hours of labor", "Multiple tasks per visit", "Lunch break factored in"],
  },
  {
    id: "hourly",
    slug: "handyman-hour",
    name: "Handyman Hour",
    category: "hourly",
    priceDollars: 119,
    durationMinutes: 60,
    blurb: "À la carte hourly — 1 hour minimum.",
    description: "When the job doesn't fit a flat rate. One-hour minimum, then 30-min increments.",
    includes: ["1-hour minimum", "30-min increments after"],
  },
];

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

/** Lightweight summary for AI tool calls */
export function getServiceCatalogSummary() {
  return SERVICES.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    priceDollars: s.priceDollars,
    durationMinutes: s.durationMinutes,
    blurb: s.blurb,
  }));
}
