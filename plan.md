# STR Market Analyzer — Web App Plan

> **Living document.** Prototype implementation lives in [`market-analyzer/`](./market-analyzer/). Ops and fix history: [`PROTOTYPE-OPERATIONS.md`](./market-analyzer/PROTOTYPE-OPERATIONS.md).  
> **Maintenance:** Agents must update this file on every product/UX change — see [§15 Build Plan Maintenance](#15-build-plan-maintenance-protocol) and `.cursor/rules/sync-build-plan.mdc`.

## Overview

A web application that automates the tedious process of manually researching and comparing U.S. cities for short-term rental (STR) investment. The user types in a city name, and the app automatically pulls economic, demographic, housing, and STR-specific data points — replacing the manual spreadsheet workflow. Past searches are saved for side-by-side market comparison.

---

## 0. Prototype Status (living)

**Last updated:** 2026-06-26

| Area | Shipped in prototype | Notes |
|---|---|---|
| **Metros** | 73 cities in `metros.json` | Each has `county` for regulation resolution |
| **Storage** | `.data/snapshots.json` + `.data/dismissed-recent.json` | Supabase schema planned; not wired yet |
| **Government data** | BEA, Census, BLS, FBI (+ state crime/tax fallbacks) | `/api/analyze` — fast path |
| **STR data** | Apify Airbnb actor | `/api/analyze/str` — two-phase quick → full |
| **Regulation** | Curated dataset v2026-06-02 | 73 city + 6 county + 1 CBSA overrides; seeds in `scripts/regulation-seeds.mjs` |
| **Scoring** | 7 weighted categories + regulation gates | STR Regulation 10%; caps rating when restrictive / not investor-eligible |
| **Pages** | `/`, `/market/[slug]`, `/compare` | Tabs: Overview, Housing, STR Data, Calculator |
| **Design** | Notion app UI + collapsible sidebar + agent side panels | Inter, collapsible left nav (localStorage), right brief panel on city dashboard, right rank panel on compare |
| **Regulation UX** | Score-hero warnings, regulation section, compare columns | Official `sources` required for `confidence: high` |
| **Tooling** | `npm run doctor`, `regulation:sync`, `regulation:coverage`, `npm test` | Coverage 73/73; Vitest regression (76 tests); CI + Husky + Cursor stop hook |
| **AI Agent** | Market Brief + Compare & Rank | `GET /api/agent/brief`, `POST /api/agent/rank`; brief and rank results auto-open in right side panels |
| **Market Discovery Agent** | Shipped (§17) | `POST /api/agent/discover`; `/discover` page; NL search → filter 73 metros → hydrate → rank shortlist |
| **Deploy / access** | Vercel Hobby + site gate | Live: [market-analyzer-lovat.vercel.app](https://market-analyzer-lovat.vercel.app) · [`DEPLOYMENT.md`](./market-analyzer/DEPLOYMENT.md) |

**Not yet in prototype:** Supabase auth, named lists, RentCast/ZipMarketData, Walk Score live API, qualitative industries/employers UI, PDF export, durable cloud storage for snapshots.

---

## 1. Current Spreadsheet Data Points (to replicate)

The existing spreadsheet tracks the following per metro area:

| Column | Data Point | Current Source |
|---|---|---|
| A | Metro (city name) | Manual entry |
| C | GDP (current) | BEA |
| D | GDP (1 Year Ago) | BEA |
| E | GDP (5 Years Ago) | BEA |
| F | GDP (10 Years Ago) | BEA |
| G | GDP Growth (target 1-3%) | Formula: `((GDP - GDP_5yr) / 5) / GDP` |
| H | Population | Best Places |
| I | Median Household Income | Best Places |
| J | Median Home Price | Best Places |
| K | Rental Population % (target 30-40%) | Best Places |
| L | Net Migration / Population Growth | Best Places |
| M | Unemployment Rate | Best Places |
| N | Job Growth | Best Places |
| O | Key Industries | Forbes |
| P | Major Employers | Chamber of Commerce |
| Q | Housing Affordability Index (target <4) | Formula: `Median Home Price / Median Income` |
| R | Price to Rent Ratio (1-15 = Buy) | Formula: `Median Home Price / Annual Rental Income` |
| S | Annual Rental Income | Dept of Numbers |
| T | Crime | Google |
| U | Landlord Friendly (Y/N) | Manual |
| V | Tax Rate | Manual |
| W | Months of Inventory | Manual |

---

## 2. Additional STR-Specific Data Points (new)

These metrics go beyond mid/long-term rental analysis and help evaluate a city specifically for STR viability:

| Data Point | Why It Matters | Source |
|---|---|---|
| Average Daily Rate (ADR) | Revenue per booked night — core STR profitability metric | **Apify** (prototype) / AirDNA / Mashvisor (production target) |
| Occupancy Rate | % of nights booked — indicates demand | **Apify** / AirDNA / Mashvisor |
| Revenue Per Available Rental (RevPAR) | ADR × Occupancy — combines rate and demand into one metric | **Apify** / AirDNA / Mashvisor |
| Average Annual Revenue | Projected gross revenue for a typical listing | **Apify** / AirDNA / Mashvisor |
| Active Listings Count | Supply — saturated markets have lower margins | **Apify** / AirDNA / Mashvisor |
| Seasonality Score | Revenue variance across months — steadier = better | **Apify** / AirDNA / Mashvisor |
| STR Regulation Friendliness | Local laws, permit requirements, zoning restrictions | **Curated** `str-regulations.json` (city → county → CBSA → state); seeds in `scripts/regulation-seeds.mjs` |
| Average Walk Score | Walkability correlates with STR demand | Walk Score API |
| Tourism / Travel Demand Indicators | Proximity to airports, attractions, events | Google Places API |
| Property Tax Rate | Affects cash-on-cash return | Census / local assessor |
| Insurance Cost Estimate | STR insurance is higher — factor into expenses | Manual / estimates |
| Cap Rate Estimate | NOI / Purchase Price — overall return metric | Calculated from other fields |
| Cash-on-Cash Return Estimate | Annual cash flow / total cash invested | Calculated from other fields |

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework — SSR, API routes, great DX |
| **Language** | TypeScript | Type safety across the entire codebase |
| **Styling** | Tailwind CSS + shadcn/ui (Notion app tokens) | Inter type, warm neutrals, blue primary; sidebar-ready tokens |
| **Database** | Supabase (PostgreSQL) | Free tier, instant REST API, built-in auth, real-time |
| **Auth** | Supabase Auth | Simple email/password or OAuth — protects saved data |
| **Charts** | Recharts | Lightweight, composable React charting library |
| **Deployment** | Vercel | Zero-config deployment for Next.js, generous free tier |
| **Data Fetching** | Server Actions + React Query | Server-side API calls (keeps keys secret), client caching |

---

## 4. Data Sources & APIs

### 4.1 Free / Government APIs (no cost)

| API | Data Points Served | Auth |
|---|---|---|
| **BEA API** (apps.bea.gov) | GDP (current, 1yr, 5yr, 10yr), GDP growth | Free API key |
| **Census Bureau ACS API** (api.census.gov) | Population, median income, rental population %, home values | Free API key |
| **BLS API** (api.bls.gov) | Unemployment rate, employment/job growth by metro | Free (registration optional, higher limits with key) |
| **FBI Crime Data API** (cde.ucr.cjis.gov) | Crime statistics by city (violent, property crime rates) | Free, no key needed |

### 4.2 Paid / Freemium APIs

| API | Data Points Served | Pricing | Prototype status |
|---|---|---|---|
| **Apify** (`malikgen/airbnb-revenue-calculator`) | ADR, occupancy, RevPAR, revenue, listings, seasonality, supply map | Pay-per-result | **In use** for STR tab |
| **AirDNA Enterprise API** | ADR, occupancy, RevPAR, revenue, active listings, seasonality | Enterprise pricing | Planned (faster than Apify) |
| **Mashvisor API** | STR revenue, occupancy, listing counts, ROI metrics, comps | Tiered plans starting ~$50/mo | Planned |
| **RentCast API** | Rental rates, market stats, days on market | Free tier (50 calls/mo), paid plans | Not integrated |
| **ZipMarketData API** | Median home price, inventory, days on market, price history | Free tier (50 calls/mo), paid plans | Not integrated |
| **Walk Score API** | Walk score, transit score, bike score | Free for low volume | Optional key; N/A without it |

### 4.2b STR Regulation (curated — no live API)

| Source | Coverage | Maintenance |
|---|---|---|
| `scripts/regulation-seeds.mjs` | Source of truth for city/county/CBSA entries | Edit seeds, then `npm run regulation:sync` |
| `src/data/str-regulations.json` | Generated dataset (do not hand-edit; sync from seeds) | Version bumped on each sync |
| `src/data/metros.json` | `county` field per metro | Updated by sync script |

**Resolution order:** city override → county override → CBSA override → state default.

**Quality rules:** `confidence: high` requires at least one official `sources` URL. Validated by `npm run regulation:coverage` and `npm run doctor`.

### 4.3 Web Scraping Fallbacks

For data not available via API (industries, major employers, landlord friendliness), the app will use a combination of:
- Curated static dataset (manually maintained JSON for top 200 metros)
- AI-assisted summaries via OpenAI API for qualitative fields (industries, major employers)
- User-editable overrides so the investor can correct or add data

### 4.4 City Resolution Strategy

The user types a city name. The app needs to resolve it to the correct identifiers for each API:
- **FIPS codes** (for Census, BEA) — use a local lookup table mapping city → MSA FIPS
- **BLS Series IDs** — derive from MSA FIPS codes using BLS naming conventions
- **ZIP codes** — for RentCast, ZipMarketData, Walk Score
- **City/State strings** — for FBI, AirDNA/Mashvisor

A `city-resolver` utility will handle this mapping with a static dataset of U.S. metros.

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Search   │  │  City Detail │  │  Comparison   │  │
│  │  + Auto-  │  │  Dashboard   │  │  Table View   │  │
│  │  complete │  │  (all data)  │  │  (saved list) │  │
│  └──────────┘  └──────────────┘  └───────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes / Server Actions      │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ City Resolver │  │ Data Fetcher │                  │
│  │ (name → IDs)  │  │ (parallel    │                  │
│  │               │  │  API calls)  │                  │
│  └──────────────┘  └──────────────┘                  │
│                                                      │
│  ┌──────────────────────────────────────────┐        │
│  │  Cache Layer (avoid redundant API calls)  │        │
│  │  - Supabase table with TTL per data type  │        │
│  │  - GDP: 90-day cache                      │        │
│  │  - STR metrics: 7-day cache               │        │
│  │  - Demographics: 30-day cache             │        │
│  └──────────────────────────────────────────┘        │
└──────────────────────┬──────────────────────────────┘
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
      ┌──────────┐ ┌────────┐ ┌────────┐
      │ Gov APIs │ │ STR    │ │ RE     │
      │ BEA/BLS/ │ │ APIs   │ │ APIs   │
      │ Census/  │ │ AirDNA │ │ Rent-  │
      │ FBI      │ │ Mashv. │ │ Cast   │
      └──────────┘ └────────┘ └────────┘
                       │
                       ▼
              ┌──────────────┐
              │   Supabase   │
              │  PostgreSQL  │
              │              │
              │ - users      │
              │ - markets    │
              │ - snapshots  │
              │ - cache      │
              └──────────────┘
```

---

## 6. Database Schema

### `users`
Standard Supabase auth — no custom table needed initially.

### `markets`
Stores each researched city as a canonical record.

```sql
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  metro_area TEXT,
  fips_code TEXT,
  zip_codes TEXT[],
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city, state)
);
```

### `market_snapshots`
Each time a user researches a city, a timestamped snapshot is saved with all data points. This preserves historical data and allows re-fetching.

```sql
CREATE TABLE market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id),
  user_id UUID REFERENCES auth.users(id),
  fetched_at TIMESTAMPTZ DEFAULT now(),

  -- Economic (BEA)
  gdp_current NUMERIC,
  gdp_1yr NUMERIC,
  gdp_5yr NUMERIC,
  gdp_10yr NUMERIC,
  gdp_growth NUMERIC, -- calculated

  -- Demographics (Census)
  population INTEGER,
  median_income NUMERIC,
  median_home_price NUMERIC,
  rental_population_pct NUMERIC,
  net_migration_pct NUMERIC,

  -- Employment (BLS)
  unemployment_rate NUMERIC,
  job_growth_pct NUMERIC,

  -- Housing Market (RentCast / ZipMarketData)
  annual_rental_income NUMERIC,
  median_rent NUMERIC,
  housing_affordability_index NUMERIC, -- calculated
  price_to_rent_ratio NUMERIC, -- calculated
  months_of_inventory NUMERIC,
  days_on_market INTEGER,
  median_list_price NUMERIC,

  -- STR Metrics (AirDNA / Mashvisor)
  str_adr NUMERIC,
  str_occupancy_rate NUMERIC,
  str_revpar NUMERIC,
  str_annual_revenue NUMERIC,
  str_active_listings INTEGER,
  str_seasonality_score NUMERIC,

  -- Qualitative / Other
  crime_rate_violent NUMERIC,
  crime_rate_property NUMERIC,
  key_industries TEXT,
  major_employers TEXT,
  landlord_friendly BOOLEAN,
  state_tax_rate NUMERIC,
  property_tax_rate NUMERIC,
  str_regulation_score TEXT, -- friendly / moderate / restrictive
  str_regulation_notes TEXT,
  walk_score INTEGER,
  transit_score INTEGER,

  -- Calculated Investment Metrics
  cap_rate_estimate NUMERIC,
  cash_on_cash_estimate NUMERIC,

  -- User overrides / notes
  user_notes TEXT
);
```

### `saved_lists`
Users can organize markets into named comparison lists.

```sql
CREATE TABLE saved_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saved_list_items (
  list_id UUID REFERENCES saved_lists(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES market_snapshots(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (list_id, snapshot_id)
);
```

### `api_cache`
Prevents redundant API calls and respects rate limits.

```sql
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL, -- e.g., "bea:gdp:26420"
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

---

## 7. UI / Pages

**Design system (2026-06-24):** Notion-inspired app UI — Inter font, warm neutrals, blue primary, left sidebar shell (`app-shell.tsx`), document-style pages (`page-frame.tsx`), database-style compare table. Light mode only.

### 7.1 Home / Search Page (`/`) — **shipped**
- Left sidebar (collapsible to icon rail; preference in `localStorage`): Search, Compare, recent markets list (dismissable; snapshot data kept for compare/cache)
- Document page with search input and recently analyzed rows (`city-card` row variant, dismiss on hover)

### 7.2 City Dashboard (`/market/[city-state]`) — **shipped**
- Breadcrumb: Search → city; re-fetch action in page header
- **Score hero**: overall score (0–3), buy/hold/avoid rating, 7 category breakdown bars, regulation decision-flag banner
- **Investment brief**: auto-opens in right side panel when generated; `MarketBriefTrigger` below score hero reopens when closed
- **STR Regulation & Risk** (above tabs): legality badge, investor eligibility, permit/primary-residence/enforcement signals, summary, official source links, resolution level (city/county/CBSA/state)
- **Tabs**
  - **Overview**: Economic Health, GDP chart, Demographics, Investment Returns, Safety & Quality
  - **Housing**: Housing Market Fundamentals
  - **STR Data**: STR Performance metrics, seasonality chart, listing map, supply section (async Apify load with quick → full phases)
  - **Calculator**: LTR/STR toggle, cap rate, cash-on-cash, cash flow, break-even; STR warning when regulation blocks investors
- **Re-fetch Data** button (government + STR refresh)

### 7.3 Comparison Table (`/compare`) — **shipped**
- Full-width database table view with sidebar navigation
- Sortable table of all saved markets
- Color-coded signal dots per metric
- Columns include overall score, housing, employment, crime, STR metrics, **STR Regulation**, **Investor OK**
- CSV export

### 7.4 Saved Lists (`/lists`) — **planned**
- User's named lists (e.g., "Southeast Markets", "Under $200k")
- Click into a list to see its comparison table
- Drag-and-drop reordering

### 7.5 Settings (`/settings`) — **planned**
- API key management (user provides their own AirDNA/Mashvisor keys)
- Default investment assumptions (down payment %, interest rate, expense ratio)
- Preferred metrics to display

### 7.6 AI Agent UI — **shipped** ([§16](#16-ai-agent--compare--rank--market-brief))
- **City dashboard:** `MarketBriefCard` in right side panel (`brief-side-panel.tsx`) — auto-opens when brief is ready; verdict, strengths/risks, regulation summary, data caveats, regenerate + explain score
- **Compare page:** row selection (2–8), investor profile form (localStorage), ranked results in right side panel (`compare-rank-side-panel.tsx`) — auto-opens when ranking starts; `CompareRankTrigger` reopens when closed; disqualified section in panel
- **No open chat in v1** — structured brief and rank outputs only

### 7.7 Market Discovery UI — **shipped** ([§17](#17-market-discovery-agent))
- **`/discover` page:** NL query form with example chips; investor profile toggle (“Apply to discovery”) — when off, `useProfile: false` and query-only pipeline (no profile defaults); ranked results in right side panel (`discovery-side-panel.tsx`) — auto-opens when discovery starts; `DiscoveryTrigger` reopens when closed; criteria chips + result cards in panel
- **Sidebar:** Discover nav item (Sparkles icon) between Search and Compare
- **Home:** “Discover markets for me” link under search bar
- **Compare integration:** “Compare top N” navigates to `/compare?select=…` with rows pre-selected

---

## 8. Build Phases

### Phase 1 — Foundation (MVP)
**Goal**: Functional search → city dashboard with free API data, saved history.

- [x] Initialize Next.js + TypeScript + Tailwind + shadcn/ui project
- [ ] Set up Supabase project (database, auth) — **deferred; prototype uses local JSON**
- [x] Build city resolver utility (city name → FIPS, ZIP, BLS series IDs, county)
- [x] Integrate free government APIs:
  - [x] BEA API (GDP data)
  - [x] Census ACS API (population, income, home price, rental %)
  - [x] BLS API (unemployment, job growth)
  - [x] FBI Crime Data API (crime rates + state fallback)
- [x] Build API route that fetches all data in parallel, caches results
- [x] Build search page with autocomplete
- [x] Build city dashboard page with data sections (tabbed layout)
- [ ] Implement Supabase auth (email/password)
- [x] Save snapshots (local `.data/snapshots.json`), show history on home page
- [x] Build basic comparison table from saved markets
- [x] Deploy to Vercel (Hobby) with shared-password site gate (`SITE_PASSWORD`, `middleware.ts`, `/login`)

**Deliverable**: Working app where you type a city and get economic + demographic + housing data automatically.

> **Prototype runbook:** See [`market-analyzer/PROTOTYPE-OPERATIONS.md`](./market-analyzer/PROTOTYPE-OPERATIONS.md) (Fix Log + troubleshooting). **When fixing bugs:** follow [§14 Fix Capture Protocol](#14-issue-resolution--fix-capture-protocol). **When shipping product/UX changes:** follow [§15 Build Plan Maintenance](#15-build-plan-maintenance-protocol). Run `npm run doctor` before each local demo.

### Phase 2 — STR Intelligence
**Goal**: Add the STR-specific data that differentiates this from a generic market tool.

- [x] Integrate Apify Airbnb actor (ADR, occupancy, RevPAR, revenue, listings) — via `malikgen/airbnb-revenue-calculator`
- [x] Two-phase STR fetch (quick preview → full sample) with `strLoadComplete` guard
- [ ] Integrate RentCast or ZipMarketData (rental rates, inventory, DOM)
- [x] Integrate Walk Score API (optional key; static N/A without it)
- [x] STR regulation dataset — full metro coverage:
  - [x] `regulation-seeds.mjs` + `sync-regulation-dataset.mjs` + `regulation-coverage.mjs`
  - [x] City override for every metro (73/73)
  - [x] County + CBSA resolution layers
  - [x] High-confidence entries require official `sources` URLs
  - [x] Regulation scoring category (10% weight) + decision gates on overall rating
  - [x] Regulation section on dashboard + compare columns
- [x] Build STR Performance section on city dashboard
- [x] Add seasonality chart (occupancy by forward window)
- [x] STR listing map + supply/competition section
- [x] Enhance comparison table with STR + regulation columns + color coding

### Phase 3 — Investment Calculator & Polish
**Goal**: Turn raw data into actionable investment decisions.

- [x] Build interactive investment calculator on city dashboard
  - Inputs: purchase price, down payment, loan terms, estimated expenses
  - Outputs: cap rate, cash-on-cash return, monthly cash flow, break-even occupancy
  - STR/LTR mode toggle; regulation warning in STR mode when not investor-eligible
- [x] Add weighted **Overall Market Score** — 7 categories with buy/hold/avoid ratings
- [x] Regulation decision gates (cap rating when restrictive / not investor-eligible)
- [x] CSV export on comparison table
- [ ] Named lists feature (create, rename, delete lists)
- [ ] PDF export
- [ ] Data freshness indicators per section (beyond `fetchedAt`)
- [ ] User notes per market (field exists; no UI)
- [ ] Mobile-responsive polish

### Phase 4 — Advanced Features (Future)
- [x] **AI Agent — Market Brief + Compare & Rank** (full spec: [§16](#16-ai-agent--compare--rank--market-brief))
  - [x] Phase A: agent foundation (`calculator.ts`, `context.ts`, types, cache)
  - [x] Phase B: `GET /api/agent/brief` + `MarketBriefCard` on city dashboard
  - [x] Phase C: `POST /api/agent/rank` + selectable compare table + rank results in right side panel
  - [x] Phase D: score explain mode, regenerate, ops/docs (metric ref tooltips deferred)
- [x] **Market Discovery Agent** (full spec: [§17](#17-market-discovery-agent))
  - [x] Phase 0: extract `analyzeMarket()` shared service
  - [x] Phase A: discovery pipeline core + `POST /api/agent/discover`
  - [x] Phase B: hydrate + bounded STR preview + cache
  - [x] Phase C: `/discover` page + sidebar nav
  - [x] Phase D: LLM summary + ops/docs
  - [ ] Phase E (optional): SSE progress stream
- [ ] Market alerts (notify when a saved market's metrics change significantly)
- [ ] Map view of saved markets with color-coded pins
- [ ] Integration with property listing APIs (Zillow, Realtor.com) for deal analysis
- [ ] Multi-user support (share lists with a partner/team)
- [ ] Historical trend charts (compare snapshots over time)

---

## 9. API Rate Limits & Caching Strategy

| API | Rate Limit | Cache Duration |
|---|---|---|
| BEA | 100 requests/min | 90 days (GDP updates quarterly) |
| Census ACS | 500 requests/day (no key), higher with key | 90 days (annual release) |
| BLS | 500/day (unregistered), 5000/day (registered) | 30 days |
| FBI Crime | Unknown (generous) | 90 days (annual release) |
| AirDNA/Mashvisor | Plan-dependent | 7 days (updates monthly) |
| Apify (STR actor) | Pay-per-result; ~30–40s/listing | 7 days (in-memory cache per process) |
| RentCast | 50/mo free, more on paid | 14 days |
| Walk Score | 5000/day | 90 days (rarely changes) |

All API responses are cached in the `api_cache` table. When a user searches for a city, the app checks cache first and only calls external APIs for expired or missing data.

**Prototype implementation note:** Snapshots persist to `market-analyzer/.data/snapshots.json` (not Supabase yet). STR data loads asynchronously via `/api/analyze/str` after government data returns. See [`PROTOTYPE-OPERATIONS.md`](./market-analyzer/PROTOTYPE-OPERATIONS.md).

### 9.1 STR / Apify latency guardrails (do not regress)

Apify STR data is the slowest path in the app (~30–40 seconds **per listing** scraped). Future changes must preserve these rules:

| Rule | Why |
|---|---|
| **Never block `/api/analyze` on Apify** | Government data returns in seconds; Apify can take minutes. Blocking the main route causes blank dashboards and browser timeouts. |
| **Default `APIFY_STR_MAX_LISTINGS=3`** | Each extra listing adds ~30–40s. Raising the default without explicit user opt-in worsens first-load UX. |
| **Two-phase fetch: `phase=quick` (1 listing) → `phase=full` (target max)** | Users see headline ADR/occupancy in ~30s while the full sample loads in the background. |
| **Snapshot guard on `/api/analyze/str`** | When `strLoadComplete` is true on disk, return cached snapshot — do not call Apify again unless `refresh=true`. |
| **Use `run-sync-get-dataset-items` only from `/api/analyze/str`** | The sync endpoint holds the HTTP connection for the entire actor run; keep it isolated with `maxDuration=300`. |
| **No STR timeouts under 60s** | A single listing scrape needs ~30–40s; shorter client timeouts cause silent null STR fields. |
| **Set `strLoadComplete` on snapshot save** | Distinguishes quick preview (1 listing) from full sample so the UI and API know when to skip re-fetch. |
| **Prefer dedicated STR APIs for production** | AirDNA/Mashvisor return aggregates in seconds; Apify scraping is a prototype trade-off, not a latency target. |

**Env tuning (prototype):**

```env
APIFY_STR_MAX_LISTINGS=3      # do not raise without updating UX copy and this section
APIFY_RUN_TIMEOUT_SECS=300
APIFY_CLIENT_TIMEOUT_MS=330000
```

**Perceived vs actual latency:** Two-phase fetch improves *perceived* latency (preview in ~30s) but full sample still costs `listings × 30–40s`. Caching (snapshot file + 7-day in-memory) makes repeat visits instant.

---

## 10. Investment Benchmarks & Buy Signal Framework

Every metric in the app displays a benchmark indicator — green (Buy), yellow (Hold / Neutral), or red (Avoid) — so you can quickly assess whether a market is worth pursuing. The benchmarks below are tuned for STR investors targeting cash-flowing properties.

### 10.1 Economic Health

| Metric | Green (Buy) | Yellow (Neutral) | Red (Avoid) | Rationale |
|---|---|---|---|---|
| GDP Growth (annualized) | 1–3% | 0.5–1% or 3–5% | <0.5% or >5% | Steady growth = stable demand. Too fast can mean overheating and regulatory risk. |
| Unemployment Rate | <4% | 4–6% | >6% | Low unemployment means more employed travelers and stronger local economy. |
| Job Growth (YoY) | >2% | 1–2% | <1% or negative | Job creation drives population inflow and travel demand. |
| Median Household Income | >$55k | $40k–$55k | <$40k | Higher incomes support local spending and tourism infrastructure. |

### 10.2 Demographics & Population

| Metric | Green (Buy) | Yellow (Neutral) | Red (Avoid) | Rationale |
|---|---|---|---|---|
| Population | >100k | 50k–100k | <50k | Larger metros have more tourism infrastructure, airports, and demand drivers. |
| Population / Net Migration Growth | >1.5% | 0.5–1.5% | <0.5% or negative | Growing cities attract more visitors and have appreciating real estate. |
| Rental Population % | 30–40% | 25–30% or 40–50% | <25% or >50% | 30–40% indicates healthy rental demand without oversaturation. Above 50% can signal economic instability. |

### 10.3 Housing Market Fundamentals

| Metric | Green (Buy) | Yellow (Neutral) | Red (Avoid) | Rationale |
|---|---|---|---|---|
| Median Home Price | <$300k | $300k–$500k | >$500k | Lower entry price = less capital at risk, easier to hit cash flow targets. |
| Housing Affordability Index | <4× | 4–5× | >5× | Home price / median income. Below 4× means locals can afford to buy, keeping the market stable. |
| Price to Rent Ratio | <15 | 15–20 | >20 | Below 15 strongly favors buying over renting — rents are high relative to prices. Above 20 means prices are inflated relative to rental income. |
| Months of Inventory | 2–4 | 4–6 | >6 | Low inventory = seller's market with appreciation potential. High inventory = softening prices. |
| Days on Market | <30 | 30–60 | >60 | Fast-selling markets indicate strong demand. |
| Median Rent (LTR) | >$1,200/mo | $900–$1,200/mo | <$900/mo | Higher baseline rents correlate with stronger STR pricing power. |
| Annual Rental Income (LTR) | >$14,400 | $10,800–$14,400 | <$10,800 | Gross annual rent. Higher = better fallback if STR regulations change. |

### 10.4 STR Performance (the most critical section for STR investors)

| Metric | Green (Buy) | Yellow (Neutral) | Red (Avoid) | Rationale |
|---|---|---|---|---|
| Average Daily Rate (ADR) | >$150 | $100–$150 | <$100 | Higher ADR means more revenue per booked night. Below $100 makes it hard to cover operating costs. |
| Occupancy Rate | >65% | 50–65% | <50% | Above 65% signals strong, consistent demand. Below 50% means too many vacant nights to cash flow. |
| RevPAR | >$100 | $60–$100 | <$60 | ADR × Occupancy. The single best performance metric — captures both rate and demand. |
| Average Annual STR Revenue | >$40k | $25k–$40k | <$25k | Gross revenue before expenses. Needs to be high enough to cover mortgage, insurance, management, and still profit. |
| Active Listings (market saturation) | <500 per 100k pop | 500–1,000 per 100k pop | >1,000 per 100k pop | Fewer listings relative to population = less competition, more pricing power. |
| Seasonality Score (revenue variance) | <20% variance | 20–40% variance | >40% variance | Low seasonality means steady year-round income. High seasonality means feast-or-famine months. |

### 10.4b STR Regulation (legal viability — separate weighted category)

Regulation is scored in its own category (not mixed into STR Performance) because it acts as a **filter** before financial metrics. See [§10.7 regulation gates](#107-overall-market-score).

| Metric | Green (Buy) | Yellow (Neutral) | Red (Avoid) | Rationale |
|---|---|---|---|---|
| STR Legality (overall) | Friendly | Moderate | Restrictive / Banned | Friendly = low legal risk; restrictive markets cap the overall rating |
| Investor Eligible | Yes | — | No | Can a non-owner/absentee investor operate STR legally? |
| Permit Required | No | Yes (simple) | Yes (lottery / capped) | Permits add cost and friction but don't always block investors |
| Primary Residence Only | No | — | Yes | Blocks absentee investors entirely |
| Enforcement Level | Low | Moderate | Active | Active enforcement increases compliance risk and fines |

**Data source (v1):** Curated `src/data/str-regulations.json` with **mandatory city override for every metro** in `metros.json`. Resolution order: **city → county → CBSA → state default**. Seeds maintained in `scripts/regulation-seeds.mjs`; sync with `npm run regulation:sync`. Coverage validated by `npm run regulation:coverage` and `npm run doctor`.

**Source requirements:** Entries with `confidence: high` must include at least one official `sources` URL (`.gov` / civic portal). Low-confidence entries show a verify-locally warning and do not use state defaults as city proxies when a city override exists.

**County layer:** `metros.json` includes a `county` field. `countyOverrides` cover unincorporated areas and shared county rules (e.g. San Bernardino CA, Sevier TN, Chatham GA, Miami-Dade FL, Osceola FL, Horry SC).

**Maintenance:** Edit `scripts/regulation-seeds.mjs`, run `npm run regulation:sync`, verify with `npm run regulation:coverage`. Bump dataset `version` on each batch update.

### 10.5 Investment Returns (calculated)

| Metric | Green (Buy) | Yellow (Neutral) | Red (Avoid) | Rationale |
|---|---|---|---|---|
| Cap Rate | >8% | 5–8% | <5% | NOI / Purchase Price. Above 8% is strong for STR. Below 5% means you're relying on appreciation, not cash flow. |
| Cash-on-Cash Return | >12% | 8–12% | <8% | Annual cash flow / cash invested. STRs should beat traditional rentals (typically 8–10%) to justify the extra work. |
| Break-Even Occupancy | <45% | 45–60% | >60% | The occupancy rate needed to cover all expenses. Lower = more margin of safety. |
| Monthly Cash Flow | >$1,000 | $500–$1,000 | <$500 | After all expenses (mortgage, insurance, management, utilities, supplies). Below $500/mo isn't worth the operational burden of STR. |

### 10.6 Market Safety & Quality of Life

| Metric | Green (Buy) | Yellow (Neutral) | Red (Avoid) | Rationale |
|---|---|---|---|---|
| Violent Crime Rate (per 100k) | <200 | 200–400 | >400 | Guests check crime stats. High crime areas get fewer bookings and worse reviews. |
| Property Crime Rate (per 100k) | <2,000 | 2,000–3,500 | >3,500 | Property crime directly affects your asset — theft, vandalism, break-ins. |
| Walk Score | >70 | 50–70 | <50 | Walkable locations command higher ADR and occupancy. Guests prefer not needing a car. |
| Transit Score | >50 | 25–50 | <25 | Public transit access expands your guest pool beyond car travelers. |
| Landlord Friendly State | Yes | Mixed | No | Landlord-friendly states make evictions and lease enforcement easier if you pivot to LTR. |
| State Income Tax Rate | <5% | 5–7% | >7% | Lower state taxes improve your net return. No-income-tax states (TX, FL, TN, NV) are ideal. |
| Property Tax Rate | <1% | 1–1.5% | >1.5% | Property tax is a fixed annual expense — high rates eat into cash flow. |

### 10.7 Overall Market Score

Each metric is assigned a score: **Green = 3 pts**, **Yellow = 2 pts**, **Red = 1 pt**. The app computes a weighted overall score per city:

| Category | Weight | Rationale |
|---|---|---|
| STR Performance (10.4) | 30% | The most direct predictor of STR profitability |
| STR Regulation (10.4b) | 10% | Legal viability — can you operate as an investor? |
| Investment Returns (10.5) | 25% | Bottom-line financial viability |
| Housing Fundamentals (10.3) | 15% | Entry cost and long-term equity position |
| Economic Health (10.1) | 10% | Macro stability of the market |
| Demographics (10.2) | 10% | Growth trajectory and demand drivers |
| Safety & Quality (10.6) | 5% | Guest experience and asset protection |

**Regulation gates** (applied after weighted score):

| Condition | Effect on overall rating |
|---|---|
| STR banned / not operating allowed | Force **Avoid** |
| Restrictive overall score, primary-residence-only, or not investor-eligible | Cap at **Hold / Watch** (cannot be Strong Buy or Buy) |
| Regulation data missing | Show warning flag; score from other categories only |

Decision flags surface in the score hero banner, regulation section, investment calculator (STR mode), and comparison table (Regulation + Investor OK columns).

**Overall Recommendation**:
- **Strong Buy** (score ≥ 2.5): Market excels across most categories — move fast on deals here
- **Buy** (score 2.0–2.49): Solid fundamentals with minor weaknesses — worth deeper due diligence
- **Hold / Watch** (score 1.5–1.99): Mixed signals — monitor for improvement before committing capital
- **Avoid** (score < 1.5): Too many red flags — capital is better deployed elsewhere

The city dashboard displays this overall score prominently at the top, with a breakdown showing which categories are pulling the score up or down. The comparison table is sortable by overall score so you can rank all saved markets at a glance.

---

## 11. File Structure

```
market-analyzer/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Home / Search
│   │   ├── market/
│   │   │   └── [slug]/
│   │   │       └── page.tsx            # City Dashboard
│   │   ├── compare/
│   │   │   └── page.tsx                # Comparison Table
│   │   ├── lists/
│   │   │   ├── page.tsx                # All Lists
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Single List
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts            # Main data fetching endpoint
│   │       ├── agent/                  # §16 — Market Brief + Compare & Rank
│   │       │   ├── brief/route.ts      # GET market brief
│   │       │   └── rank/route.ts       # POST compare & rank
│   │       └── auth/
│   │           └── callback/
│   │               └── route.ts
│   ├── lib/
│   │   ├── agent/                      # §16 AI agent
│   │   │   ├── types.ts
│   │   │   ├── context.ts
│   │   │   ├── calculator.ts
│   │   │   ├── pre-rank.ts
│   │   │   ├── prompts.ts
│   │   │   ├── schemas.ts
│   │   │   ├── cache.ts
│   │   │   ├── openai.ts
│   │   │   ├── service.ts
│   │   │   ├── config.ts
│   │   │   └── rate-limit.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── api/
│   │   │   ├── bea.ts                  # BEA GDP fetcher
│   │   │   ├── census.ts               # Census ACS fetcher
│   │   │   ├── bls.ts                  # BLS employment fetcher
│   │   │   ├── fbi-crime.ts            # FBI crime data fetcher
│   │   │   ├── airdna.ts               # AirDNA / Mashvisor STR data
│   │   │   ├── rentcast.ts             # Rental market data
│   │   │   └── walkscore.ts            # Walk Score fetcher
│   │   ├── city-resolver.ts            # City name → FIPS, ZIP, BLS IDs
│   │   ├── cache.ts                    # Cache read/write helpers
│   │   ├── calculations.ts            # Derived metrics (cap rate, etc.)
│   │   ├── str-regulations.ts         # Regulation lookup (city→county→cbsa→state)
│   │   ├── finalize-snapshot.ts       # Re-score stored snapshots with regulation
│   │   ├── thresholds.ts              # Color coding + regulation gates
│   │   └── __tests__/                 # Vitest regression suite (61 tests)
│   │       ├── calculations.test.ts
│   │       ├── city-resolver.test.ts
│   │       ├── str-regulations.test.ts
│   │       ├── thresholds.test.ts
│   │       ├── finalize-snapshot.test.ts
│   │       ├── data-integrity.test.ts
│   │       ├── agent-calculator.test.ts
│   │       ├── agent-pre-rank.test.ts
│   │       ├── agent-cache.test.ts
│   │       └── fixtures.ts
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives (Notion tokens)
│   │   ├── app-shell.tsx               # Collapsible sidebar + brief panel shell
│   │   ├── brief-panel-context.tsx     # Brief panel open/market state
│   │   ├── brief-side-panel.tsx        # Right panel for investment brief
│   │   ├── market-brief-trigger.tsx    # Reopen brief when panel closed
│   │   ├── page-frame.tsx              # Document page wrapper + breadcrumbs
│   │   ├── search-bar.tsx
│   │   ├── city-card.tsx
│   │   ├── dashboard/
│   │   │   ├── economics-section.tsx
│   │   │   ├── housing-section.tsx
│   │   │   ├── str-section.tsx
│   │   │   ├── regulation-section.tsx  # STR regulation badges + sources
│   │   │   ├── market-brief-card.tsx   # §16 AI investment brief
│   │   │   ├── market-health-section.tsx
│   │   │   ├── qualitative-section.tsx
│   │   │   └── investment-calculator.tsx
│   │   ├── comparison-table.tsx
│   │   ├── compare-rank-panel.tsx      # §16 rank results content
│   │   ├── compare-rank-side-panel.tsx # §16 rank right panel shell
│   │   ├── compare-rank-panel-context.tsx
│   │   ├── compare-rank-trigger.tsx
│   │   ├── discovery-results-panel.tsx # §17 discovery ranked cards
│   │   ├── discovery-side-panel.tsx    # §17 discovery right panel shell
│   │   ├── discovery-panel-context.tsx
│   │   ├── discovery-trigger.tsx
│   │   ├── discovery-query-form.tsx
│   │   ├── discovery-criteria-chips.tsx
│   │   ├── brief-side-panel.tsx
│   │   ├── brief-panel-context.tsx
│   │   ├── investor-profile-form.tsx   # §16 investor assumptions
│   │   ├── agent-loading-state.tsx     # §16 loading skeleton
│   │   └── metric-badge.tsx            # Green/yellow/red indicator
│   ├── data/
│   │   ├── metros.json                 # City → FIPS/ZIP/county mapping
│   │   └── str-regulations.json        # Regulation dataset (sync from seeds)
│   └── types/
│       └── market.ts                   # TypeScript interfaces
├── scripts/
│   ├── doctor.mjs
│   ├── regulation-seeds.mjs            # Source of truth for regulation entries
│   ├── sync-regulation-dataset.mjs     # Merge seeds → JSON + metro counties
│   └── regulation-coverage.mjs         # Validate coverage + high-confidence sources
├── .github/workflows/
│   └── regression.yml                  # CI: npm test on push/PR
├── .husky/
│   └── pre-commit                      # Local: npm test before commit
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local                          # API keys (BEA, Census, BLS, etc.)
├── next.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 12. Environment Variables Required

```env
# Supabase (planned — not required for local prototype)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Government APIs (free)
BEA_API_KEY=
CENSUS_API_KEY=
BLS_API_KEY=
FBI_API_KEY=                 # optional; state crime fallback without it

# STR Data (prototype)
APIFY_API_TOKEN=
APIFY_STR_MAX_LISTINGS=3
APIFY_RUN_TIMEOUT_SECS=300
APIFY_CLIENT_TIMEOUT_MS=330000

# STR Data (production target)
AIRDNA_API_KEY=
MASHVISOR_API_KEY=

# Real Estate Data (planned)
RENTCAST_API_KEY=
ZIPMARKETDATA_API_KEY=

# Other
WALKSCORE_API_KEY=           # optional

# AI Agent (§16 — Market Brief + Compare & Rank)
OPENAI_API_KEY=              # required for agent routes; app works without it
OPENAI_MODEL=gpt-4o-mini     # override to gpt-4o for higher quality
AGENT_ENABLED=true           # set false to hide agent UI

# Site gate (production — see §17 and DEPLOYMENT.md)
SITE_PASSWORD=               # shared password; empty locally = open access
SITE_AUTH_SECRET=            # optional cookie-signing secret; random string in production
```

**Regulation dataset (no API key):** maintain via `npm run regulation:sync` after editing `scripts/regulation-seeds.mjs`.

---

## 17. Production Deployment

> **Canonical runbook:** [`market-analyzer/DEPLOYMENT.md`](./market-analyzer/DEPLOYMENT.md)  
> **Ops / troubleshooting:** [`market-analyzer/PROTOTYPE-OPERATIONS.md`](./market-analyzer/PROTOTYPE-OPERATIONS.md)

### Live prototype (2026-06-25)

| | |
|---|---|
| **URL** | https://market-analyzer-lovat.vercel.app |
| **Auth** | `/login` — shared password (`SITE_PASSWORD` in Vercel; not in git) |
| **Host** | Vercel Hobby · project `side-project-prototypes/market-analyzer` |
| **Repo** | https://github.com/szhao11/STR-Market-Analyzer-Agent · app root `market-analyzer/` |

### Site gate (shipped)

Middleware + login page — no Vercel Pro password add-on.

| Component | Path |
|---|---|
| Middleware | `src/middleware.ts` |
| Auth helpers | `src/lib/site-auth.ts` |
| Login UI | `src/app/login/page.tsx` |
| Login API | `src/app/api/auth/login/route.ts` |

- **Production:** set `SITE_PASSWORD` (+ recommended `SITE_AUTH_SECRET`) in Vercel env.
- **Local dev:** leave `SITE_PASSWORD` empty for open access.

### Redeploy

```bash
cd market-analyzer
npm test && npm run build
npx vercel --prod
```

### Known Hobby limits

- **Snapshots** — `.data/` is ephemeral on serverless (re-analyze after cold starts).
- **STR route** — `maxDuration = 300` may exceed Hobby timeout; government data + UI still work.

Full env table, verify steps, and password rotation: **DEPLOYMENT.md**.

---

## 13. Getting Started (first session)

```bash
npx create-next-app@latest market-analyzer --typescript --tailwind --eslint --app --src-dir
cd market-analyzer
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr recharts
npm install -D @types/node
```

Then: set up Supabase project, run migrations, add API keys to `.env.local`, and start building Phase 1.

---

## 14. Issue Resolution & Fix Capture Protocol

**Every resolved bug, data-loading failure, or prototype regression must be documented before the work is considered done.** This keeps the prototype reliable across sessions and prevents the same failures from recurring.

### Where fixes live

| Document | Purpose |
|---|---|
| [`market-analyzer/PROTOTYPE-OPERATIONS.md`](./market-analyzer/PROTOTYPE-OPERATIONS.md) | **Living fix log** — append each resolved issue here (primary) |
| [`plan.md`](./plan.md) §14 | Fix capture protocol and template (this section) |
| [`plan.md`](./plan.md) §15 | **Build plan maintenance** — keep plan in sync with product/UX |
| `.cursor/rules/capture-fixes.mdc` | Cursor rule — enforces fix capture automatically |
| `.cursor/rules/sync-build-plan.mdc` | Cursor rule — enforces plan updates on product changes |

### When to capture (required)

Document a fix entry when any of the following is resolved:

- Dashboard section not loading data
- API route returning empty/null unexpectedly
- Timeout, rate limit, or third-party API failure (Apify, FBI, etc.)
- Storage/cache regression
- Environment or configuration mistake
- UI silently swallowing errors

### Fix entry template

Append a new `### FIX-NNN` block to the **Fix Log** section in `PROTOTYPE-OPERATIONS.md` (increment the ID). Copy this template:

```markdown
### FIX-NNN: Short title

| Field | Detail |
|---|---|
| **Date** | YYYY-MM-DD |
| **Symptom** | What the user saw |
| **Cause** | Root cause (not just proximate error) |
| **Fix** | What changed |
| **Files** | `path/to/file.ts`, … |
| **Do not regress** | One-line guardrail for future changes |
| **Verify** | Command or steps to confirm it works |
```

### Completion checklist (before closing any bug-fix task)

- [ ] Root cause identified (not only symptom patched)
- [ ] Code/config fix applied
- [ ] Fix Log entry added to `PROTOTYPE-OPERATIONS.md` (new `FIX-NNN`)
- [ ] Troubleshooting table updated if it was a common failure mode
- [ ] `.env.example` or `npm run doctor` updated if env-related
- [ ] `npm run doctor` passes (or warnings documented)
- [ ] Affected dashboard section manually verified or curl-tested

### Agent / developer instruction

> When you resolve an issue in this repo, **always** append a Fix Log entry to `PROTOTYPE-OPERATIONS.md` in the same session. Do not wait for the user to ask. If the fix changes startup requirements, update `scripts/doctor.mjs` or `.env.example` in the same commit.

See `.cursor/rules/capture-fixes.mdc` for the always-on Cursor rule that enforces this.

---

## 15. Build Plan Maintenance Protocol

**Every product or user-experience change to the Market Analyzer must update `plan.md` in the same session** — before the task is considered complete. This keeps the build plan aligned with what is actually shipped in the prototype.

### When to update the plan (required)

Update `plan.md` when you change any of the following:

- **Pages or navigation** — new routes, tabs, dashboard sections, comparison columns
- **Scoring or benchmarks** — weights, thresholds, regulation gates, overall rating logic
- **Data coverage** — new APIs, curated datasets, metro/regulation seeds, env vars
- **User workflows** — analyze flow, STR two-phase fetch, re-fetch, export, compare behavior
- **Build phases** — completing or deferring phase items; changing scope
- **Tooling** — new `npm run` scripts, doctor checks, ops runbook expectations

### When a plan update is NOT required

- Internal refactors with no user-visible or data-model change
- Test-only changes
- Fix log entries alone (use §14 + `capture-fixes.mdc` instead)

### What to update (checklist)

1. **§0 Prototype Status** — bump `Last updated` date; revise table rows that changed
2. **§7 UI / Pages** — match actual screens, tabs, and sections
3. **§8 Build Phases** — check/uncheck boxes; add sub-bullets for delivered work
4. **§4 / §9 / §12** — data sources, caching, env vars if integrations changed
5. **§10** — benchmarks, weights, regulation rules if scoring changed
6. **§11 File Structure** — new scripts, data files, components
7. **`PROTOTYPE-OPERATIONS.md`** — troubleshooting table if users could hit new failure modes (not required for pure UX copy)

### Regulation-specific maintenance

When editing STR regulation data:

1. Change `scripts/regulation-seeds.mjs` (not `str-regulations.json` directly)
2. Run `npm run regulation:sync`
3. Run `npm run regulation:coverage` and `npm run doctor`
4. Update §0 and §4.2b in this plan if coverage model or quality rules changed

### Agent / developer instruction

> When you ship a product or UX change in `market-analyzer/`, **always** update the relevant sections of `plan.md` in the same session. Do not wait for the user to ask. If the change fixes a bug, also follow §14.

See `.cursor/rules/sync-build-plan.mdc` for the always-on Cursor rule that enforces this.

---

## 16. AI Agent — Compare & Rank + Market Brief

> **Status:** Shipped (Phase 4). First AI layer for the prototype — grounded in existing snapshots, scoring (`thresholds.ts`), and calculator logic. Not a generic chatbot.

### 1. Goals

| Goal | Success criteria |
|------|------------------|
| **Market Brief** | On `/market/[slug]`, user gets a 30-second investment memo: verdict, strengths/risks, regulation callout, key metrics — all cited to snapshot fields |
| **Compare & Rank** | On `/compare`, user selects 2–8 markets, sets investor assumptions, gets ranked list with one-line rationale per market |
| **Trust** | Agent never invents numbers; regulation gates from code cannot be overridden; missing STR data is flagged |
| **Cost/latency** | Brief cached per snapshot; compare uses deterministic pre-filter before LLM; typical response &lt; 15s |

**Non-goals (v1):** open-ended chat, web search, property-level underwriting, auth/multi-user profiles.

### 2. User flows

#### 2.1 Market Brief (city dashboard)

```
User opens /market/[slug]
  → Page calls GET /api/agent/brief?city=&state=
  → API checks .data/agent-cache.json (snapshotId + promptVersion)
  → On miss: buildMarketContext(snapshot) → OpenAI structured JSON → cache
  → MarketBriefCard renders below ScoreHero
```

**UX:**
- New **Investment Brief** card directly under `ScoreHero` (above regulation section).
- States: loading skeleton → brief → error with retry.
- **Regenerate** button (`refresh=true`) bypasses cache.
- **Explain my score** expands category walkthrough (same API, `mode=explain`).

#### 2.2 Compare & Rank (compare page)

```
User selects 2–8 markets on /compare + sets investor profile
  → POST /api/agent/rank { snapshotIds, profile }
  → Deterministic pre-rank (gates + weighted score)
  → LLM writes rationales for pre-ranked order
  → Ranked cards above comparison table; disqualified markets in separate section
```

**UX:**
- Row checkboxes on `ComparisonTable` (or “select all”).
- **Investor profile panel** (collapsible): budget, down payment %, interest rate, expense ratio, absentee investor toggle.
- **Rank selected** → ranked cards (#1, #2, #3) with rationale + link to market page.
- Markets failing regulation gates appear in **Disqualified** section (deterministic, not LLM).

### 3. Architecture

#### 3.1 Layering

```
src/lib/agent/
├── types.ts              # MarketBrief, CompareRankResult, InvestorProfile
├── context.ts            # buildMarketContext() — snapshot → LLM-safe facts
├── calculator.ts         # runInvestmentScenario() — extracted from investment-calculator.tsx
├── pre-rank.ts           # deterministic filter + sort before LLM
├── prompts.ts            # system + user prompt templates, PROMPT_VERSION
├── schemas.ts            # Zod schemas for LLM output validation
├── cache.ts              # read/write .data/agent-cache.json
├── openai.ts             # client wrapper, model config
└── tools/
    ├── get-snapshot.ts
    ├── score-breakdown.ts
    └── run-calculator.ts

src/app/api/agent/
├── brief/route.ts        # GET — single market brief
└── rank/route.ts         # POST — compare & rank
```

**Key principle:** Tools return facts; LLM writes prose and tradeoff reasoning only.

#### 3.2 Grounding contract

The LLM receives a **facts block** (JSON), not raw API access:

```typescript
interface MarketContextFacts {
  city: string;
  stateAbbr: string;
  fetchedAt: string;
  overallScore: number | null;
  overallRating: string | null;
  decisionFlags: string[];
  categories: CategoryScore[];           // from scoreMarket()
  regulation: {
    level: string;
    investorEligible: boolean | null;
    summary: string | null;
    confidence: string | null;
    sources: { label: string; url: string }[];
  };
  str: {
    adr: number | null;
    occupancy: number | null;
    revpar: number | null;
    annualRevenue: number | null;
    seasonality: number | null;
    loadComplete: boolean;
    fetchError: string | null;
  };
  housing: { medianHomePrice; medianRent; affordabilityIndex; priceToRent };
  returns: { capRate; cashOnCash };      // from snapshot defaults
  calculatorScenario: CalculatorResult;  // under default or user profile
  dataGaps: string[];                    // e.g. "STR preview only (1 listing)"
}
```

**Hard rules in system prompt:**
1. Every numeric claim must match `facts` exactly.
2. If `strInvestorEligible === false` or rating is `Avoid`, verdict cannot be “pursue.”
3. Never contradict `decisionFlags` or regulation gates.
4. Cite metrics as `(metric: value)` — UI maps to dashboard sections.
5. If `dataGaps` non-empty, lead with data quality caveat.

### 4. Data models

Add to `src/types/market.ts` (or `src/lib/agent/types.ts`):

```typescript
export interface InvestorProfile {
  maxPurchasePrice: number;      // default 500000
  downPaymentPct: number;        // default 25
  interestRate: number;          // default 7
  loanTermYears: number;         // default 30
  expenseRatioPct: number;       // default 40 (STR)
  absenteeInvestor: boolean;     // default true
  minMonthlyCashFlow: number;    // default 500
}

export interface MarketBrief {
  generatedAt: string;
  promptVersion: string;
  snapshotId: string;
  verdict: "Pursue" | "Watch" | "Pass";
  verdictAlignsWithRating: boolean;
  headline: string;              // one sentence
  regulationSummary: string;     // 2–3 sentences, regulation first
  strengths: BriefBullet[];      // max 3
  risks: BriefBullet[];          // max 3
  strOutlook: string | null;     // null if no STR data
  ltrFallback: string | null;
  dataCaveats: string[];
}

export interface BriefBullet {
  text: string;
  metricRefs: string[];          // e.g. ["strRevpar", "strSeasonalityScore"]
}

export interface RankedMarket {
  rank: number;
  city: string;
  stateAbbr: string;
  snapshotId: string;
  score: number;
  rating: string;
  rationale: string;             // one line
  keyMetric: string;             // e.g. "RevPAR $118"
  disqualified?: boolean;
  disqualifyReason?: string;
}

export interface CompareRankResult {
  generatedAt: string;
  promptVersion: string;
  profile: InvestorProfile;
  summary: string;               // 2–3 sentences across markets
  ranked: RankedMarket[];
  disqualified: RankedMarket[];
}
```

### 5. API design

#### 5.1 `GET /api/agent/brief`

| Param | Required | Notes |
|-------|----------|-------|
| `city` | yes | |
| `state` | yes | state abbr |
| `mode` | no | `brief` (default) or `explain` |
| `refresh` | no | `true` bypasses cache |

**Response:** `MarketBrief` (+ optional `explain` sections for score walkthrough).

**Errors:**
- `404` — no snapshot for city
- `503` — `OPENAI_API_KEY` missing
- `502` — LLM/validation failure

**Route config:** `maxDuration = 60` (LLM only; no Apify).

#### 5.2 `POST /api/agent/rank`

**Body:**
```json
{
  "snapshotIds": ["id1", "id2", "id3"],
  "profile": { "maxPurchasePrice": 350000, "absenteeInvestor": true }
}
```

**Validation:**
- 2–8 snapshot IDs
- All must exist in `snapshots.json`

**Pipeline:**
1. `finalizeSnapshot()` each
2. `preRankMarkets(snapshots, profile)` — deterministic
3. LLM receives pre-ranked list + facts; may reorder within eligible set only
4. Validate output: disqualified markets cannot appear in `ranked`

### 6. Deterministic pre-rank (before LLM)

Extract shared calculator logic to `src/lib/agent/calculator.ts` (mirror `investment-calculator.tsx`):

```typescript
export function runInvestmentScenario(
  snapshot: MarketSnapshot,
  profile: InvestorProfile,
  mode: "str" | "ltr"
): CalculatorResult
```

**Pre-rank scoring** (weighted, tunable):

| Factor | Weight | Source |
|--------|--------|--------|
| Regulation eligible | Gate | `strInvestorEligible`, gates in `thresholds.ts` |
| Under budget | Gate | `medianHomePrice <= maxPurchasePrice` |
| Overall score | 25% | `overallScore` |
| STR RevPAR signal | 25% | `thresholds.strRules` |
| Cash-on-cash under profile | 25% | `runInvestmentScenario()` |
| Seasonality | 10% | `strSeasonalityScore` |
| Affordability | 15% | `housingAffordabilityIndex` |

Absentee investors: auto-disqualify if `strInvestorEligible === false`, `primaryResidenceOnly`, or `banned`.

LLM job: write rationales for the pre-ranked order; explain tradeoffs (e.g. “#2 has higher RevPAR but worse regulation confidence”).

### 7. Caching

**File:** `.data/agent-cache.json` (prototype; migrate to `api_cache` table with Supabase).

**Cache key:**
```
brief:{snapshotId}:{promptVersion}:{mode}
rank:{hash(snapshotIds.sort())}:{hash(profile)}:{promptVersion}
```

**Invalidation:**
- Snapshot `fetchedAt` newer than brief `generatedAt`
- `promptVersion` bump in `prompts.ts`
- User `refresh=true`

**TTL:** 30 days (briefs are cheap to regenerate; snapshot staleness is the real trigger).

### 8. LLM integration

#### 8.1 Provider & model

| Env var | Purpose |
|---------|---------|
| `OPENAI_API_KEY` | Required for agent routes |
| `OPENAI_MODEL` | Default `gpt-4o-mini` (cost); override to `gpt-4o` for quality |
| `AGENT_ENABLED` | `true`/`false` — hide UI when false |

Add to `.env.example` and `scripts/doctor.mjs` (warn if missing, not fail — app works without agent).

#### 8.2 Structured output

Use OpenAI **JSON schema / structured outputs** + Zod validation in `schemas.ts`. On validation failure: retry once with “fix JSON” message; then return 502.

#### 8.3 Prompt versioning

`PROMPT_VERSION = "1.0.0"` in `prompts.ts`. Bump on any prompt change to invalidate cache.

### 9. UI components

#### 9.1 New components

| Component | Location | Purpose |
|-----------|----------|---------|
| `market-brief-card.tsx` | `src/components/dashboard/` | Brief display on city page |
| `investor-profile-form.tsx` | `src/components/` | Shared profile inputs |
| `compare-rank-panel.tsx` | `src/components/` | Rank results + disqualified list (panel + card variants) |
| `compare-rank-side-panel.tsx` | `src/components/` | Right panel shell for compare rank |
| `compare-rank-trigger.tsx` | `src/components/` | Reopen rank panel when closed |
| `agent-loading-state.tsx` | `src/components/` | Skeleton + “Analyzing…” copy |

#### 9.2 City page (`page.tsx`)

Insert after `ScoreHero`:

```tsx
<MarketBriefCard city={city} stateAbbr={stateAbbr} />
```

Lazy-load on mount (don’t block government/STR data). Show placeholder if `AGENT_ENABLED` false or no API key (doctor warning pattern).

#### 9.3 Compare page

- Add selection state to `ComparisonTable` (optional prop `selectable`).
- Add `InvestorProfileForm` + `CompareRankPanel` above table.
- Persist profile to `localStorage` key `ma-investor-profile`.

### 10. Implementation phases

#### Phase A — Foundation (2–3 days)

- [x] `src/lib/agent/calculator.ts` — extract from `investment-calculator.tsx`
- [x] `src/lib/agent/context.ts` — `buildMarketContext()`
- [x] `src/lib/agent/types.ts`, `schemas.ts`, `prompts.ts`
- [x] `src/lib/agent/openai.ts`, `cache.ts`
- [x] Env vars + doctor warning
- [x] Unit tests: `calculator.ts`, `pre-rank.ts`, `buildMarketContext()`

#### Phase B — Market Brief (2 days)

- [x] `GET /api/agent/brief`
- [x] `MarketBriefCard` on city dashboard
- [x] Cache read/write
- [ ] Manual verify: Austin, restrictive market, missing STR

#### Phase C — Compare & Rank (2–3 days)

- [x] `pre-rank.ts`
- [x] `POST /api/agent/rank`
- [x] Selectable comparison table
- [x] `InvestorProfileForm` + `CompareRankPanel`
- [x] localStorage profile persistence

#### Phase D — Polish (1–2 days)

- [x] `mode=explain` for score walkthrough
- [ ] Metric ref tooltips (click bullet → scroll to metric)
- [x] Error states, regenerate, loading copy
- [x] Update §7, §8 Phase 4, §11 in this plan when shipped
- [x] `PROTOTYPE-OPERATIONS.md` troubleshooting row for missing OpenAI key

**Total estimate:** ~7–10 dev days.

### 11. Testing & verification

#### 11.1 Unit tests

| Test | Assert |
|------|--------|
| Calculator parity | Server `runInvestmentScenario` matches UI calculator for same inputs |
| Pre-rank gates | Absentee + primary-residence market → disqualified |
| Brief schema | Invalid LLM JSON rejected |
| Cache invalidation | New `fetchedAt` → cache miss |

#### 11.2 Manual test matrix

| Scenario | Expected |
|----------|----------|
| Strong Buy + friendly regulation | Brief verdict “Pursue”, aligns with rating |
| Restrictive + investor ineligible | Brief “Pass” or “Watch”; rank disqualified |
| STR quick preview only | `dataCaveats` mentions partial STR |
| No `OPENAI_API_KEY` | UI shows setup message; routes 503 |
| Compare 5 markets, $300k budget | Markets over budget disqualified or ranked lower |
| Cached brief + Re-fetch Data | Brief regenerates on next load |

#### 11.3 Doctor / ops

```bash
npm run doctor          # warns if OPENAI_API_KEY missing
curl "/api/agent/brief?city=Austin&state=TX"
curl -X POST /api/agent/rank -d '{"snapshotIds":[...],"profile":{...}}'
```

### 12. Cost & guardrails

| Control | Value |
|---------|-------|
| Max markets per rank | 8 |
| Max brief regenerations | 3/min per IP (simple in-memory rate limit) |
| Model default | `gpt-4o-mini` (~$0.01–0.03 per brief) |
| Input token budget | ~2–4k per brief (facts JSON only) |
| No streaming v1 | Full JSON response; simpler validation |

**Do not regress STR latency guardrails (§9.1):** Agent routes must never call Apify or block `/api/analyze`.

### 13. Plan updates when shipping

Per [§15 Build Plan Maintenance](#15-build-plan-maintenance-protocol):

| Section | Update |
|---------|--------|
| §0 Prototype Status | Add “AI Agent: Market Brief + Compare Rank” row |
| §7 UI | Brief in right panel on dashboard; rank results in right panel on compare |
| §8 Phase 4 | Check agent phase items |
| §11 File Structure | `src/lib/agent/*`, `src/app/api/agent/*` |
| §12 Env | `OPENAI_API_KEY`, `OPENAI_MODEL`, `AGENT_ENABLED` |

### 14. Future extensions (post-v1)

- **Market Discovery Agent** — full spec in [§17](#17-market-discovery-agent)
- **Chat panel** with same tools (brief/rank/discover as first tools, not open chat)
- **Saved investor profiles** when Supabase auth ships
- **Brief on home cards** — one-line headline per saved market
- **Email/slack alerts** when rank order changes after re-fetch

### 15. Open decisions

| Decision | Recommendation | Alternative |
|----------|----------------|-------------|
| Model provider | OpenAI (already in plan) | Anthropic via env switch |
| Brief auto-load vs on-demand | Auto-load after score hero renders | Button “Generate brief” (saves API cost) |
| Rank order authority | Pre-rank order is canonical; LLM narrates only | Let LLM reorder eligible markets (riskier) |
| Store briefs on snapshot | Separate cache file v1 | Embed `marketBrief` on `MarketSnapshot` |

**Recommended:** Auto-load brief; pre-rank order canonical; separate cache file.

---

## 17. Market Discovery Agent

> **Status:** Shipped (Phases 0–D). Second agentic layer — user describes investment criteria in natural language; the system **searches all 73 metros**, hydrates missing data, and returns a ranked shortlist with rationales. SSE progress (Phase E) deferred.

### 1. Goals

| Goal | Success criteria |
|------|------------------|
| **Natural-language discovery** | User types e.g. *"5 cash-flowing STR markets under $400k, low regulation risk, occupancy >60%"* and gets a shortlist in &lt; 60s |
| **Autonomous orchestration** | System decides which metros to analyze, which snapshots to hydrate, and whether to fetch STR preview — user does not pick cities manually |
| **Trust** | All numbers from snapshots/scoring/calculator; LLM parses intent and writes prose only; regulation gates cannot be overridden |
| **Cost control** | Cheap regulation + cached snapshot filters first; Apify STR preview only for top finalists (bounded); no full STR load in v1 |
| **Actionable output** | Ranked cards with score, key metric, one-line rationale, links to `/market/[slug]`; optional "Add all to compare" |

**Non-goals (v1):**

- Open-ended chat or multi-turn refinement loops
- Web search or live ordinance scraping
- Property-level / listing-level search
- Full Apify STR load for every candidate (too slow + expensive)
- Searching metros outside `metros.json`

### 2. What makes this "agentic" vs §16

| §16 (Brief / Rank) | §17 (Discovery) |
|---|---|
| User already chose city(ies) | User states **criteria**; system chooses cities |
| Single LLM call | LLM parse + optional summary LLM call |
| Reads existing snapshots only (rank) | **Creates or refreshes** snapshots when missing/stale |
| No branching | **Conditional pipeline**: filter → hydrate → re-score → STR preview for finalists |
| Fixed input size (1 or 2–8 markets) | Scans up to **73 metros** with early exit |

**v1 agent pattern:** *Plan → execute deterministic pipeline → narrate results.* Not a free-form tool-calling loop (that is v2 — see §17.10).

### 3. User flows

#### 3.1 Primary flow (Discover page)

```
User opens /discover
  → Enters NL query + optional investor profile (reuse InvestorProfileForm)
  → POST /api/agent/discover { query, profile?, limit?, refresh? }
  → Server:
      1. parseDiscoveryQuery(query) → DiscoveryCriteria (LLM, structured JSON)
      2. runDiscoveryPipeline(criteria, profile) → DiscoveryResult (deterministic)
      3. generateDiscoverySummary(result) → rationales (LLM, optional if cached)
  → DiscoverResultsPanel: ranked cards + parsed criteria chips + "Search again"
  → User clicks city → /market/[slug]; or "Compare top N"
```

#### 3.2 Shortcut from home

```
Home / Search page → link "Discover markets for me" → /discover
Optional: pre-fill from localStorage investor profile (same key as compare)
```

#### 3.3 Example queries (acceptance tests)

| Query | Expected behavior |
|---|---|
| "5 markets under $350k with friendly STR rules" | Budget + regulation filter; absentee-eligible only |
| "Best cash flow in Texas, occupancy above 55%" | `statesInclude: ["TX"]`; min occupancy; rank by calculator CoC |
| "Low regulation risk, RevPAR over $80, not California" | `statesExclude: ["CA"]`; min RevPAR; restrictive markets disqualified |
| "Strong buy markets I haven't analyzed yet" | Prefer metros without cached snapshot; hydrate gov data only |
| "Same as my compare profile but find 3 new markets" | Merge stored profile; exclude snapshot IDs user already has |

### 4. Architecture

#### 4.1 Layering

```
src/lib/
├── analyze-market.ts              # NEW — extract from api/analyze/route.ts (shared hydrate)
├── agent/
│   ├── discovery/
│   │   ├── types.ts               # DiscoveryCriteria, DiscoveryResult, DiscoveryCandidate
│   │   ├── schemas.ts             # Zod: criteria + result validation
│   │   ├── parse-query.ts         # NL → DiscoveryCriteria (LLM)
│   │   ├── filter-metros.ts       # Cheap pre-filter on regulation + metro list
│   │   ├── pipeline.ts            # runDiscoveryPipeline() — main orchestrator
│   │   ├── hydrate.ts             # getOrAnalyzeSnapshot(metro) — cache-first
│   │   ├── score-candidates.ts    # apply criteria + preRankMarkets composite
│   │   ├── str-preview.ts         # bounded Apify quick phase for finalists
│   │   ├── prompts.ts             # PARSE + SUMMARY prompts, DISCOVERY_PROMPT_VERSION
│   │   └── cache.ts               # discovery cache keys (extends agent-cache pattern)
│   └── tools/                     # v2 — optional tool registry for LLM loop
│       ├── list-metros.ts
│       ├── get-snapshot.ts
│       ├── analyze-market.ts
│       └── score-breakdown.ts

src/app/
├── discover/page.tsx              # NEW — query input + results
├── api/agent/discover/route.ts    # POST — discovery endpoint
└── api/agent/discover/stream/route.ts  # OPTIONAL v1.1 — SSE progress events
```

**Key principle (same as §16):** Tools and pipeline return facts; LLM parses intent and writes rationales only. **Rank order is deterministic**; LLM narrates the given order.

#### 4.2 Prerequisite refactor

Extract snapshot hydration from `src/app/api/analyze/route.ts` into `src/lib/analyze-market.ts`:

```typescript
export async function analyzeMarket(
  metro: MetroEntry,
  options?: { refresh?: boolean; save?: boolean }
): Promise<{ snapshot: MarketSnapshot; scores: CategoryScore[]; flags: string[]; cached: boolean }>
```

Both `/api/analyze` and discovery pipeline call this. **Do not duplicate** fetch logic in the agent layer.

#### 4.3 Discovery pipeline (v1)

```
Input: DiscoveryCriteria + InvestorProfile + limit (default 5, max 10)

Phase A — Cheap filter (no API calls, no LLM)
  metros = getAllMetros()  // 73
  → filter by statesInclude / statesExclude
  → filter by regulation: enrichRegulationFields(metro) + getDisqualifyReason() when absentee
  → filter banned / primary-residence-only if criteria.excludeRestrictive
  → exclude snapshotIds if criteria.excludeSnapshotIds
  Output: candidateMetros[] (typically 40–70)

Phase B — Snapshot hydrate (parallel, bounded concurrency = 4)
  For each metro in candidateMetros:
    snapshot = getSnapshot(city, state) OR analyzeMarket(metro, { save: true })
    Skip if stale (> DISCOVERY_SNAPSHOT_MAX_AGE_DAYS) and criteria.requireFresh — refresh
  Output: snapshots[]

Phase C — Criteria scoring (deterministic)
  Apply numeric filters: maxPurchasePrice, minOccupancy, minRevpar, minOverallScore,
    minCashOnCash, minPopulation, maxAffordabilityIndex, ratingsAllow[]
  Run preRankMarkets(snapshots, profile) for composite ordering
  Take top DISCOVERY_STR_PREVIEW_POOL (default 15) for Phase D
  Output: rankedCandidates[] (may lack STR)

Phase D — STR preview (optional, bounded)
  For top N candidates missing strAdr OR strLoadComplete !== true:
    Call internal str quick phase (same as /api/analyze/str?phase=quick)
    Max DISCOVERY_STR_FETCH_MAX (default 5) Apify calls per discovery run
  Re-run score-candidates on updated snapshots
  Output: finalTop limit candidates

Phase E — Summary (LLM, one call)
  Input: final ranked list + criteria + profile + matchReasons (deterministic strings)
  Output: DiscoveryResult.summary + per-market rationale (1 sentence each)
  Cache by discoveryCacheKey(criteriaHash, profileHash, promptVersion)
```

#### 4.4 Progress events (v1.1 optional)

SSE stream for UX during long runs:

```typescript
type DiscoveryProgressEvent =
  | { type: "parsed"; criteria: DiscoveryCriteria }
  | { type: "filter"; remaining: number; total: 73 }
  | { type: "hydrate"; city: string; stateAbbr: string; cached: boolean }
  | { type: "str_preview"; city: string; stateAbbr: string }
  | { type: "complete"; result: DiscoveryResult };
```

### 5. Data models

Add to `src/lib/agent/discovery/types.ts`:

```typescript
export interface DiscoveryCriteria {
  /** Human-readable restatement of parsed intent */
  intentSummary: string;
  limit: number;                        // 1–10, default 5

  // Geography
  statesInclude?: string[];             // e.g. ["TX", "FL"]
  statesExclude?: string[];             // e.g. ["CA", "NY"]

  // Investor / eligibility (merged with profile; criteria can tighten)
  absenteeInvestor?: boolean;
  excludeRestrictive?: boolean;         // default true when absentee
  excludeSnapshotIds?: string[];

  // Numeric thresholds (null = no filter)
  maxPurchasePrice?: number | null;
  minOccupancy?: number | null;         // 0–100
  minRevpar?: number | null;
  minOverallScore?: number | null;      // 0–10
  minCashOnCash?: number | null;        // % under profile assumptions
  minPopulation?: number | null;
  maxAffordabilityIndex?: number | null;
  ratingsAllow?: ("Strong Buy" | "Buy" | "Hold / Watch")[];

  // Behavior
  preferUnanalyzed?: boolean;           // boost metros without cached snapshot
  requireFresh?: boolean;               // ignore snapshots older than N days
}

export interface DiscoveryCandidate {
  rank: number;
  city: string;
  stateAbbr: string;
  snapshotId: string;
  slug: string;
  overallScore: number;
  rating: string;
  keyMetric: string;                    // from preRankMarkets
  matchReasons: string[];               // deterministic, e.g. "RevPAR $112D"
  rationale: string;                    // LLM one-liner
  disqualified?: boolean;
  disqualifyReason?: string;
  dataGaps: string[];
}

export interface DiscoveryResult {
  generatedAt: string;
  promptVersion: string;
  query: string;
  criteria: DiscoveryCriteria;
  profile: InvestorProfile;
  summary: string;                      // 2–3 sentences
  ranked: DiscoveryCandidate[];
  considered: number;                   // metros after Phase A
  hydrated: number;                     // snapshots loaded or fetched
  strPreviewsFetched: number;
  noResultsReason?: string;             // e.g. "No markets met occupancy ≥ 65%"
}
```

**Parse-query output schema** (`discoveryCriteriaSchema` in `schemas.ts`) is validated with Zod; invalid LLM output → retry once → 502.

### 6. API design

#### 6.1 `POST /api/agent/discover`

**Body:**

```json
{
  "query": "Find 5 cash-flowing STR markets under $400k with low regulation risk",
  "profile": { "maxPurchasePrice": 400000, "absenteeInvestor": true },
  "limit": 5,
  "refresh": false
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `query` | yes | 10–500 chars |
| `profile` | no | Partial `InvestorProfile`; merged with defaults |
| `limit` | no | 1–10, default 5 |
| `refresh` | no | Bypass discovery cache |

**Response:** `DiscoveryResult`

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Missing/invalid query, limit out of range |
| `503` | Agent disabled or no `OPENAI_API_KEY` |
| `502` | LLM parse/summary failure |
| `504` | Pipeline timeout (see guardrails) |

**Route config:** `maxDuration = 60` (Vercel Hobby). Pipeline must complete within budget or return partial results + `noResultsReason`.

#### 6.2 Rate limit

Reuse `checkRateLimit` from `rate-limit.ts`:

- Key: `discover:${ip}`
- **2 requests / minute** (stricter than brief — discovery is heavier)

#### 6.3 Cache

Extend `.data/agent-cache.json` (or `agent-discovery-cache.json` if file grows large):

```
Key: sha256(queryNormalized + profileHash + limit + DISCOVERY_PROMPT_VERSION)
TTL: invalidate when any returned snapshot `fetchedAt` is older than result `generatedAt`
```

### 7. UI

#### 7.1 `/discover` page

| Section | Component | Notes |
|---------|-----------|-------|
| Query | `DiscoveryQueryForm` | Textarea + example chips ("Under $400k Texas", "Low regulation") |
| Profile | Reuse `InvestorProfileForm` | Collapsible; persist to `localStorage` (`investor-profile`) |
| Submit | Primary button | Disabled while loading |
| Progress | `AgentLoadingState` variant | "Filtering 73 metros…", "Analyzing Nashville…" (v1.1 SSE) |
| Criteria | `DiscoveryCriteriaChips` | Parsed filters editable in v2; read-only v1 |
| Results | `DiscoveryResultsPanel` | Ranked cards: #1–#N, score badge, rationale, key metric |
| Actions | Footer | "Compare top 5" → `/compare` with snapshot IDs; "Open #1" |

#### 7.2 Navigation

- Sidebar: new item **Discover** (Sparkles icon) between Search and Compare
- Home: secondary link under search bar

#### 7.3 Empty / no-results states

- **No matches:** Show relaxed criteria suggestion ("Try raising budget to $450k" — deterministic from nearest miss)
- **Agent unavailable:** Same pattern as `MarketBriefCard` setup message

### 8. Deterministic matching (before LLM summary)

`score-candidates.ts` builds `matchReasons[]` per candidate:

```typescript
// Examples — all computed in code
if (criteria.minRevpar && snapshot.strRevpar >= criteria.minRevpar)
  reasons.push(`RevPAR ${formatCurrency(snapshot.strRevpar)} ≥ ${criteria.minRevpar}`);
if (criteria.maxPurchasePrice && snapshot.medianHomePrice <= criteria.maxPurchasePrice)
  reasons.push(`Median price within budget`);
```

**No-results helper:** If `ranked.length === 0`, compute which filter eliminated the most metros and return actionable `noResultsReason`.

**Prefer-unanalyzed boost:** Add +0.05 to composite score when no cached snapshot existed before hydrate (tie-breaker only).

### 9. Cost & guardrails

| Control | Value | Rationale |
|---------|-------|-----------|
| Metro universe | 73 (`metros.json`) | Fixed catalog |
| Hydrate concurrency | 4 | Avoid BEA/Census rate limits |
| STR preview max | 5 per run | Apify cost cap |
| STR phase | `quick` only | No full load in discovery v1 |
| Pipeline timeout | 55s | Leave headroom under `maxDuration = 60` |
| LLM calls | 2 max (parse + summary) | No per-city LLM |
| Discovery rate limit | 2/min/IP | Heavier than brief |
| Never block | `/api/analyze` UX | Discovery runs in background route only |

**Env vars (add to `.env.example` + doctor):**

```env
DISCOVERY_ENABLED=true              # default true when AGENT_ENABLED
DISCOVERY_STR_FETCH_MAX=5
DISCOVERY_STR_PREVIEW_POOL=15
DISCOVERY_SNAPSHOT_MAX_AGE_DAYS=30
DISCOVERY_HYDRATE_CONCURRENCY=4
```

### 10. Build phases

#### Phase 0 — Refactor (1 day)

- [x] Extract `analyzeMarket()` to `src/lib/analyze-market.ts`
- [x] Refactor `/api/analyze/route.ts` to call it
- [x] Unit test: analyzeMarket returns same shape as route

#### Phase A — Discovery core (2–3 days)

- [x] `discovery/types.ts`, `schemas.ts`, `filter-metros.ts`, `score-candidates.ts`
- [x] `discovery/pipeline.ts` — Phases A–C (no STR, no LLM summary)
- [x] `discovery/parse-query.ts` + prompts
- [x] `POST /api/agent/discover` — parse + pipeline + stub summary
- [x] Tests: filter-metros, score-candidates, pipeline with fixtures

#### Phase B — Hydrate + STR (2 days)

- [x] `discovery/hydrate.ts` — cache-first analyzeMarket
- [x] `discovery/str-preview.ts` — bounded quick STR
- [x] Phase D in pipeline + re-score
- [x] Discovery cache read/write

#### Phase C — UI (2 days)

- [x] `/discover` page + components
- [x] Sidebar nav + home link
- [x] "Compare top N" integration
- [x] Loading / error / no-results states

#### Phase D — Summary LLM + polish (1–2 days)

- [x] `generateDiscoverySummary()` — rationales for deterministic order
- [x] Rate limit + doctor checks for discovery env vars
- [x] Manual test matrix (§17.12)
- [x] Update §0, §7, §8, §11, `PROTOTYPE-OPERATIONS.md`

#### Phase E — SSE progress (optional, 1 day)

- [ ] `GET /api/agent/discover/stream` or POST with `Accept: text/event-stream`
- [ ] Progress UI on discover page

**Total estimate:** ~8–11 dev days (excluding Phase E).

### 11. Testing

#### 11.1 Unit tests (`src/lib/__tests__/discovery/`)

| Test | Assert |
|------|--------|
| `filter-metros` | TX-only criteria returns only TX metros |
| Regulation pre-filter | Absentee + primary-residence city excluded in Phase A |
| `score-candidates` | minRevpar filter drops sub-threshold markets |
| `parse-query` | Mock LLM schema validation; retry on invalid |
| Pipeline no STR | Returns ranked list from cached snapshots only |
| No-results reason | Over-strict budget → helpful message |
| Cache key | Same query + profile → cache hit |

#### 11.2 Integration / manual matrix

| Scenario | Expected |
|----------|----------|
| "5 under $400k friendly STR" | ≥1 result; no banned markets; rationales cite facts |
| All 73 fail budget | `ranked: []`, clear `noResultsReason` |
| Cached snapshots | Fast path; `hydrated` counts cache hits |
| Missing OPENAI_API_KEY | 503 on discover route |
| STR preview cap | 6th finalist does not trigger Apify if max=5 |
| Compare top 5 | Navigates to compare with 5 snapshot IDs pre-selected |

#### 11.3 Doctor / ops

```bash
npm run doctor    # warn if DISCOVERY_ENABLED but no OPENAI_API_KEY
npm test          # discovery unit tests
curl -X POST /api/agent/discover \
  -H "Content-Type: application/json" \
  -d '{"query":"3 Texas markets under 350k","limit":3}'
```

### 12. Plan updates when shipping

Per [§15 Build Plan Maintenance](#15-build-plan-maintenance-protocol):

| Section | Update |
|---------|--------|
| §0 | Market Discovery Agent row → shipped |
| §7 | `/discover` page, sidebar item |
| §8 | New phase checkboxes for discovery |
| §11 | `src/lib/agent/discovery/*`, `src/app/discover/*` |
| §12 Env | `DISCOVERY_*` vars |
| `PROTOTYPE-OPERATIONS.md` | Troubleshooting: discovery timeout, no results, Apify cap |

### 13. Open decisions

| Decision | Recommendation | Alternative |
|----------|----------------|-------------|
| Rank authority | Deterministic pipeline order; LLM narrates only (same as §16 rank) | LLM re-ranks eligible set |
| Editable parsed criteria | Read-only chips v1 | Inline edit → re-run pipeline without re-parse |
| STR in discovery | Quick preview for top 5 only | No STR in v1 (faster, less useful) |
| Page vs modal | Dedicated `/discover` page | Modal from home search |
| Snapshot stale policy | 30 days; gov-only refresh | Always refresh (slow) |
| v2 tool loop | Defer | Full OpenAI function-calling agent per finalist |

**Recommended:** Deterministic rank; read-only chips v1; STR quick for top 5; `/discover` page; 30-day stale; defer tool loop to v2.

### 14. v2 — True tool-calling agent (future)

When v1 pipeline proves useful, upgrade parse + execute to an **agent loop**:

```
User query
  → LLM planner with tools: list_metros, get_snapshot, analyze_market, str_preview, score_breakdown
  → Max 12 tool calls, $0.50/run budget
  → Stop when limit candidates found or budget exhausted
  → Same DiscoveryResult output shape
```

Reuse `src/lib/agent/tools/*` sketched in §16. v1 pipeline becomes the **fallback** when the loop times out.

### 15. Relationship to §16 agents

| Feature | Uses from §16 |
|---------|---------------|
| Discovery | `mergeInvestorProfile`, `preRankMarkets`, `getDisqualifyReason`, `buildMarketContext`, `assertAgentAvailable`, cache pattern, `InvestorProfileForm` |
| After discovery | User opens city → existing **Market Brief** auto-loads |
| Compare | "Compare top N" feeds existing **Compare & Rank** |

Discovery is the **top-of-funnel** agent; Brief and Rank remain **depth** agents on chosen markets.
