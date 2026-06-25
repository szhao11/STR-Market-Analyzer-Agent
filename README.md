# STR Market Analyzer

Analyze U.S. cities for short-term rental (STR) investment potential. Type a city name and instantly get economic, demographic, housing, and investment data pulled from government APIs.

## Features

- **City Search** — Autocomplete search across 70+ U.S. metros
- **Market Dashboard** — GDP, employment, housing, demographics, crime, and investment metrics
- **Investment Benchmarks** — Green/yellow/red signals based on STR investment thresholds
- **Overall Market Score** — Weighted composite score with buy/hold/avoid ratings
- **Investment Calculator** — Interactive calculator for cap rate, cash-on-cash, and cash flow
- **Comparison Table** — Side-by-side comparison of all analyzed markets, sortable by any metric
- **CSV Export** — Export comparison data for offline analysis

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** + shadcn/ui
- **Recharts** for data visualization
- **Government APIs**: BEA (GDP), Census ACS (demographics), BLS (employment), FBI (crime)
- **Apify**: Airbnb STR market data (ADR, occupancy, RevPAR, revenue, seasonality, supply map, competition metrics)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Before each session:** run `npm run doctor` to verify API keys, storage, and Apify status. See [PROTOTYPE-OPERATIONS.md](./PROTOTYPE-OPERATIONS.md) for troubleshooting and the **Fix Log** (all resolved issues are captured there per [plan.md §14](../plan.md#14-issue-resolution--fix-capture-protocol)).

## API Keys (Optional)

The app works without API keys but returns placeholder data. For live data, add keys to `.env.local`:

```env
BEA_API_KEY=        # https://apps.bea.gov/api/signup/
CENSUS_API_KEY=     # https://api.census.gov/data/key_signup.html
BLS_API_KEY=        # https://data.bls.gov/registrationEngine/
APIFY_API_TOKEN=    # https://console.apify.com/account/integrations
```

Copy `.env.example` to `.env.local` and fill in your keys. `.env.local` is gitignored and will not be pushed to GitHub.

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── page.tsx            # Home / Search page
│   ├── market/[slug]/      # City dashboard
│   ├── compare/            # Comparison table
│   └── api/                # API routes (analyze, analyze/str, search, snapshots)
├── components/             # React components
│   ├── dashboard/          # Dashboard section components
│   ├── ui/                 # shadcn/ui primitives
│   ├── search-bar.tsx      # City search with autocomplete
│   ├── city-card.tsx       # City summary card
│   ├── comparison-table.tsx # Side-by-side comparison
│   ├── metric-badge.tsx    # Signal-colored metric display
│   └── navbar.tsx          # Navigation bar
├── lib/                    # Utilities and API clients
│   ├── api/                # Government + Apify API fetchers
│   ├── cache.ts            # In-memory cache layer
│   ├── calculations.ts     # Derived metric formulas
│   ├── city-resolver.ts    # City name → API identifiers
│   ├── storage.ts          # Snapshot persistence (.data/snapshots.json)
│   └── thresholds.ts       # Investment benchmark rules
├── data/                   # Static data files
│   └── metros.json         # U.S. metro area database
└── types/
    └── market.ts           # TypeScript interfaces
```
