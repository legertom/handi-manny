# Handi-Manny

**The booking platform for NYC's most trusted handyman.**

Handi-Manny is a full-stack Next.js app that lets NYC apartment dwellers book a vetted handyman (Manny) for flat-rate jobs — TV mounts, AC installs, IKEA assembly, faucet swaps, wall repair, and more. Customers get transparent pricing, real-time availability, and an AI chat assistant that quotes jobs instantly. Manny gets a dashboard to review and confirm bookings.

> **Status:** Demo / MVP. In-memory storage, stubbed Stripe and notifications. Production-ready UI, architecture designed for easy swap to real backends.

---

## Architecture

```
app/
├── page.tsx                       # Marketing landing page
├── book/                          # Multi-step booking flow
│   ├── page.tsx
│   └── confirmation/[id]/page.tsx
├── services/                      # Service catalog + detail pages
│   ├── page.tsx
│   └── [slug]/page.tsx
├── manny/                         # Manny's admin dashboard
│   ├── page.tsx
│   └── bookings/[id]/page.tsx
├── api/
│   ├── chat/route.ts              # AI chat endpoint (Claude + AI SDK)
│   ├── bookings/route.ts          # Booking creation + Stripe auth
│   ├── bookings/[id]/confirm/     # Manny confirms → capture payment
│   ├── bookings/[id]/decline/     # Manny declines → void auth
│   ├── availability/route.ts      # Real-time slot availability
│   └── uploads/route.ts           # Photo upload for job context
├── layout.tsx                     # Root layout with chat widget
└── globals.css                    # Tailwind v4 design tokens

lib/
├── chat-agent.ts     # AI agent definition (tools, system prompt, model)
├── services.ts       # Service catalog (prices, durations, descriptions)
├── intake.ts         # Per-service intake forms, pricing engine, validation
├── availability.ts   # Slot generation with conflict detection
├── store.ts          # In-memory booking store (swap to DB for prod)
├── stripe.ts         # Stripe auth/capture/void stubs
├── notify.ts         # SMS + email notification stubs
├── links.ts          # URL helpers (tel:, sms:, dashboard deep links)
└── utils.ts          # Shared formatting utilities

components/
├── chat-widget.tsx   # Floating "Ask Manny" button (lazy-loads panel)
├── chat-panel.tsx    # Full chat UI with markdown rendering
├── booking/          # Booking flow steps (intake, slots, photos, payment)
├── manny/            # Admin dashboard components
└── ui/               # Design system primitives (Button, Card, Badge, etc.)
```

---

## AI Features

### 1. "Ask Manny" Chat Assistant

A conversational AI assistant embedded as a floating widget on every page. Customers describe what they need in plain English and get real quotes, availability checks, and booking links — no forms required.

**Stack:**

| Layer | Technology |
|-------|-----------|
| Model | Claude Sonnet 4.6 via [Vercel AI Gateway](https://sdk.vercel.ai) (`anthropic/claude-sonnet-4.6`) |
| Agent framework | AI SDK v6 `ToolLoopAgent` — the agent calls tools in a loop until it has enough info to respond |
| Transport | `DefaultChatTransport` → streams to the client over the AI SDK's UI message protocol |
| Client hook | `useChat` from `@ai-sdk/react` with full streaming, stop, and error handling |

**Agent tools:**

The agent has four tools it can call autonomously during a conversation:

- **`listServices`** — Returns the full service catalog with prices and durations. Called when the customer asks "what do you do?" or before quoting a price.
- **`getServiceDetails`** — Fetches granular info for one service: what's included, what's excluded, exact duration, and a direct booking URL.
- **`getAvailability`** — Checks Manny's real upcoming schedule for a given service. Returns available start times per day for the next 1-14 days, with conflict detection against existing bookings.
- **`refuseSpecialistJob`** — Tags the conversation when a job clearly requires a licensed plumber, electrician, or other specialist. The agent uses this to politely decline and explain why.

**How it works:**

```
Customer: "I need to mount a 65 inch TV on a brick wall"
    │
    ▼
Agent calls listServices → gets full catalog
Agent calls getServiceDetails("tv-mount") → $179, 90 min, includes/excludes
Agent calls getAvailability("tv-mount", 7) → next week's open slots
    │
    ▼
Agent responds: quote, what's included, availability summary,
                and a [Book it](/book?service=tv-mount) link
```

The agent is capped at 8 tool-call steps per turn (`stopWhen: stepCountIs(8)`) to prevent runaway loops.

**System prompt design:**

The system prompt is carefully tuned for this use case:
- Voice: warm and direct, no fluff, no emojis — sounds like an NYC tradesperson
- Guardrails: never invents prices, always quotes from the catalog tool
- Honesty: explicitly declines jobs that need licensed specialists
- Output constraints: optimized for a narrow 400px chat panel — no tables, no ASCII art, short paragraphs, markdown links for booking CTAs

**Chat UI features:**

- Lazy-loaded via `next/dynamic` — zero JS cost until the user opens the chat
- Tool-call visualization: animated pills show "Checking the price book...", "Checking Manny's calendar..." as tools execute
- Custom markdown renderer with `react-markdown` + `remark-gfm`: internal links use Next.js `<Link>`, tables gracefully degrade to stacked key-value pairs, code stays compact
- Streaming with stop button, error states with phone fallback
- Suggested prompts on first open for zero-friction engagement

### 2. AI-Powered Intake & Pricing Engine

While not a standalone AI model, the intake system (`lib/intake.ts`) implements the same kind of structured decision-making that typically requires AI:

- **Dynamic pricing:** Total price is computed from base service price + question-driven deltas + add-on deltas. Selecting "Over 65 inches" for a TV mount adds $40; choosing "In-wall cable concealment" adds $80 and 30 extra minutes.
- **Hard-block routing:** Certain answer combinations automatically block booking and explain why — e.g., selecting "Over 14,000 BTU" for an AC install shows a message directing the customer to a licensed HVAC tech.
- **Smart upsells:** Options like "More than 10 items" for art hanging suggest that a Half-Day Block is better value, nudging customers toward the right service.

### 3. Agent-Aware Service Catalog

The service catalog (`lib/services.ts`) exposes a `getServiceCatalogSummary()` function specifically designed for AI tool calls — a lightweight projection with just `id`, `name`, `category`, `priceDollars`, `durationMinutes`, and `blurb`. This keeps token usage lean when the agent needs to scan the full menu.

---

## Key Features

### For Customers

- **Flat-rate pricing** — no hourly surprises; prices shown upfront
- **6-step booking flow** — Service → Job details → Time slot → Contact → Review → Pay
- **Per-service intake forms** — smart questions, add-ons, and dynamic price breakdowns
- **Real-time availability** — 30-minute slot granularity, conflict detection, 2-hour lead time buffer
- **Photo uploads** — client-side compression (max 1600px, JPEG @ 78% quality), drag-and-drop, camera capture on mobile
- **AI chat assistant** — get quotes and check availability without touching a form

### For Manny (Admin)

- **Dashboard at `/manny`** — filterable by status (pending, confirmed, completed, all)
- **Booking detail pages** — full customer info, intake answers, photos, price breakdown
- **Confirm / Decline actions** — confirm captures the Stripe auth; decline voids it
- **SMS deep links** — new bookings text Manny a link he can tap to review on his phone

### Business Logic

- **Auth-then-capture payments** — card is authorized at booking, captured only after Manny confirms and work is done
- **Cancellation policy** — free 24+ hours out, 50% within 24 hours, 100% no-show
- **Specialist routing** — jobs requiring licensed plumber/electrician are blocked with honest explanations, both in the intake flow and via the AI chat
- **Notification system** — customer confirmations, Manny alerts, and reminder scaffolding (24h, morning-of, 1h before)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| AI | AI SDK v6, Claude Sonnet 4.6, `ToolLoopAgent` |
| Styling | Tailwind CSS v4, Radix UI primitives |
| Validation | Zod v4 |
| Payments | Stripe (stubbed — auth/capture/void pattern) |
| Fonts | Plus Jakarta Sans, Archivo, JetBrains Mono via `next/font` |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 20+
- An Anthropic API key (for the AI chat) or Vercel AI Gateway access

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` with:

```env
# Required for AI chat
ANTHROPIC_API_KEY=sk-ant-...

# Optional — stubbed for demo
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Production Roadmap

The app is architected for a clean swap from demo stubs to real services:

| Component | Current (Demo) | Production Target |
|-----------|----------------|-------------------|
| Database | In-memory `Map` | Neon Postgres (Vercel Marketplace) |
| Payments | Console-log stubs | Stripe PaymentIntents (manual capture) |
| Notifications | Console-log stubs | Resend (email) + Twilio (SMS) |
| Photo storage | In-memory buffer | Vercel Blob |
| Auth (admin) | None | Simple password or Clerk |

---

## License

Private. Not open source.
