# KachraCash (`কচৰা ক্যাশ`)

**Asset-light circular economy platform for doorstep scrap pickup in Guwahati, Assam.**

KachraCash connects residents with verified collectors through a three-step promise:

**Schedule → Weigh transparently → Instant UPI payout**

Citizens book a 2-hour pickup slot. Collectors weigh scrap on a BLE hanging scale with live telemetry. Settlement happens via UPI — no cash handoffs, no haggling.

---

## Applications

| App | Path | Stack | Port | Purpose |
|-----|------|-------|------|---------|
| **Citizen** | `apps/citizen` | Expo SDK 57 · React Native | 8081 | 3-tap booking, ward & slot selection, pickup tracking |
| **Partner** | `apps/partner` | Expo SDK 57 · React Native (Android) | 8082 | Collector field app, BLE scale, OTP settlement |
| **Admin** | `apps/admin` | SvelteKit 5 · Tailwind CSS 4 | 5173 | Dispatch radar, ward suspension, float ledger, rate cards |

All three apps share the **Glade** design system — deep pine greens on warm cream, Fraunces display type, and gold CTAs.

---

## Tech stack

### Monorepo

- **pnpm** workspaces + **Turborepo** task orchestration
- **TypeScript** strict mode across all packages
- **Zod** schema validation at API boundaries

### Shared packages

| Package | Description |
|---------|-------------|
| `@kachracash/types` | Shared DTOs, Zod schemas, BLE payload definitions |
| `@kachracash/ui` | Glade design tokens + React Native components |
| `@kachracash/api` | Fastify REST API (rates, pickups, orders, admin ops) |
| `@kachracash/db` | Prisma ORM · Neon Postgres + PostGIS |

### Key integrations

- **BLE GATT** hanging scale (`0000ffe0-0000-1000-8000-00805f9b34fb`)
- **UPI payouts** via RazorpayX / Cashfree (stub gateway in dev)
- **PostGIS** ward boundaries for Guwahati Municipal Corporation pilot

---

## Quick start

### Prerequisites

- Node.js 20+
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- PostgreSQL database (Neon recommended) for API integration tests

### Install

```bash
pnpm install
```

### Environment

Copy example env files and set `DATABASE_URL`:

```bash
cp packages/db/.env.example packages/db/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/citizen/.env.example apps/citizen/.env
cp apps/partner/.env.example apps/partner/.env
```

### Database setup

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Run everything

```bash
pnpm dev
```

This starts:

| Service | URL |
|---------|-----|
| Product hub | http://localhost:5173/ |
| Citizen web preview | http://localhost:5173/citizen |
| Partner web preview | http://localhost:5173/partner |
| Admin console | http://localhost:5173/admin |
| API | http://localhost:3000 |
| Citizen Expo | http://localhost:8081 |
| Partner Expo | http://localhost:8082 |

---

## UI preview (no install required)

Open these files directly in a browser for a quick visual review:

| File | Contents |
|------|----------|
| [`docs/ui-preview.html`](docs/ui-preview.html) | All three apps side-by-side with interactive tabs |
| [`docs/glade-design-system.html`](docs/glade-design-system.html) | Full Glade component library and tokens |

When the dev server is running, the hub at http://localhost:5173/ links to live interactive previews.

---

## Testing

### Unit tests (pricing, BLE parser, payout gateway)

```bash
pnpm test:unit
```

### Integration tests (requires `DATABASE_URL`)

```bash
pnpm test:integration
```

### Type checking & lint

```bash
pnpm check
pnpm lint
```

### End-to-end pilot flow (manual)

1. Start `pnpm dev` and confirm API health at `GET /health`
2. **Citizen app** — book a pickup (category → ward → slot → confirm)
3. **Partner app** — accept pickup, connect BLE simulator, tare → add weight → lock → enter OTP → complete
4. **Citizen app** — verify pickup status moves to `COMPLETED` with UPI receipt
5. **Admin console** — check dispatch radar, suspend/resume a ward, review float ledger

---

## Project structure

```
kachracash/
├── apps/
│   ├── citizen/          # Expo consumer app (iOS + Android)
│   ├── partner/          # Expo collector app (Android only)
│   └── admin/            # SvelteKit ops console
├── packages/
│   ├── api/              # Fastify REST API
│   ├── db/               # Prisma schema & migrations
│   ├── types/            # Shared TypeScript + Zod
│   └── ui/               # Glade tokens & RN components
├── docs/
│   ├── PRD.md            # Product requirements
│   ├── ARCHITECTURE.md   # System design
│   ├── DESIGN.md         # UX / Glade design system
│   ├── TDD.md            # Test contract
│   ├── AGENTS.md         # Coding rules for AI agents
│   ├── ui-preview.html   # Quick UI review
│   └── glade-design-system.html
└── package.json
```

---

## Design principles

1. **Show the weight, show the price** — BLE telemetry + tabular figures for all currency and kg values
2. **One primary action per screen** — gold CTA for the standout action
3. **Zero physical cash** — 100% UPI settlement per transaction
4. **Fixed floor rates** — no live bidding or reverse auctions (Phase 1)
5. **Warm, trustworthy, local** — cream surfaces + forest actions; built for Guwahati conditions

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/PRD.md`](docs/PRD.md) | What to build |
| [`docs/PHASES.md`](docs/PHASES.md) | Roadmap & phasing |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How systems connect |
| [`docs/DESIGN.md`](docs/DESIGN.md) | UX and Glade design system |
| [`docs/TDD.md`](docs/TDD.md) | Verification contract |
| [`docs/AGENTS.md`](docs/AGENTS.md) | Engineering rules |

---

## Pilot coverage

GMC pilot wards: **Beltola, Jayanagar, Ganeshguri, Hatigaon, Noonmati**

Phase 1 scope: fixed floor rate cards · BLE scale ingestion · pre-funded collector float · 4-digit OTP verification · 8% platform take-rate · admin ward flood suspension.

---

## License

Private — KachraCash pilot repository.
