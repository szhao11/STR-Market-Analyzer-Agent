# Prototype Operations & Known Fixes

Runbook for running the STR Market Analyzer locally without hitting the data-loading issues discovered during prototype testing (June 2026).

**Related docs:** [README.md](./README.md) · [plan.md §14 Fix Capture Protocol](./plan.md#14-issue-resolution--fix-capture-protocol)

> **Maintainers & agents:** When you resolve any bug in this prototype, append a new `FIX-NNN` entry to the [Fix Log](#fix-log) below before finishing the task. See [plan.md §14](./plan.md#14-issue-resolution--fix-capture-protocol) for the template and checklist.

---

## Quick start (every session)

```bash
cd market-analyzer
npm install          # first time only
npm test             # regression suite (no API keys required)
npm run doctor       # pre-flight checks (env, storage, Apify)
npm run dev
```

**Automation:** regression tests also run on `git commit` (Husky), on push/PR (GitHub Actions), and at the end of Cursor agent sessions (`.cursor/hooks.json` stop hook). Agents must add tests for new product behavior — see `.cursor/rules/regression-tests.mdc`.

Open [http://localhost:3000](http://localhost:3000), search a city, then open the market dashboard.

| Tab | What to expect |
|---|---|
| **Overview** | Economic, demographic, investment, and safety metrics load in ~1–3 seconds |
| **STR Data** | Quick preview in **~30s** (1 listing), full sample in **~1–2 min** (3 listings); cached after that |
| **Calculator** | Works immediately; STR mode pre-fills after Apify data loads |

---

## Architecture (how data loads)

```
User searches city
       │
       ▼
GET /api/analyze  ──► BEA, Census, BLS, FBI (parallel, fast)
       │              Saves snapshot → .data/snapshots.json
       │              Investment metrics use LTR rent as fallback
       ▼
Dashboard renders (government data visible)
       │
       ▼
GET /api/analyze/str  ──► Apify actor (two-phase: 1 listing quick, then 3 full)
       │                  Snapshot guard skips Apify when data already on disk
       │                  Merges STR into same snapshot file
       │                  Re-scores dashboard
       ▼
STR tab populates (ADR, occupancy, charts, map)
```

**Why two steps?** Apify runs take minutes. Government APIs return in seconds. Splitting avoids blank dashboards and browser timeouts.

---

## Fix Log

Structured record of resolved issues. **Append a new entry (increment `FIX-NNN`) whenever a bug is fixed** — do not rely on memory or chat history.

<!-- FIX-LOG:START -->

### FIX-001: STR route could not find snapshot (in-memory storage)

| Field | Detail |
|---|---|
| **Date** | 2026-06-23 |
| **Symptom** | STR Data tab stuck on N/A; server log: `Run market analysis first before fetching STR data` |
| **Cause** | Snapshots in a module-level array; Next.js API routes use separate workers — `/api/analyze` and `/api/analyze/str` did not share memory |
| **Fix** | File-based persistence in `src/lib/storage.ts` → `.data/snapshots.json` |
| **Files** | `src/lib/storage.ts`, `.gitignore` |
| **Do not regress** | Never revert to in-memory-only storage without a shared database |
| **Verify** | `curl /api/analyze?...&refresh=true` then `curl /api/analyze/str?...` — second call must not return 404 |

### FIX-002: Apify aborted at 8s (STR always null)

| Field | Detail |
|---|---|
| **Date** | 2026-06-23 |
| **Symptom** | All STR fields `null`; fetch completed in &lt;1 second |
| **Cause** | `APIFY_ANALYZE_WAIT_MS=8000` race in `/api/analyze` aborted Apify before listings finished (~30s each) |
| **Fix** | Removed Apify from `/api/analyze`; dedicated `/api/analyze/str` with timeout tied to `APIFY_RUN_TIMEOUT_SECS` (default 300s) |
| **Files** | `src/app/api/analyze/route.ts`, `src/app/api/analyze/str/route.ts`, `src/app/market/[slug]/page.tsx` |
| **Do not regress** | Do not block `/api/analyze` on Apify or use STR timeouts &lt;60s |
| **Verify** | STR curl takes 1–3 min and returns `strAdr` + `strError: null` |

### FIX-003: Apify 402 memory limit exceeded

| Field | Detail |
|---|---|
| **Date** | 2026-06-23 |
| **Symptom** | STR fetch returns in ~400ms; server log: `actor-memory-limit-exceeded` |
| **Cause** | Stuck Apify actor runs consumed free-tier 8GB memory pool |
| **Fix** | `abortRunningActorRuns()` in `apify-str.ts` aborts RUNNING jobs and retries once; `strFetchError` surfaced in UI |
| **Files** | `src/lib/api/apify-str.ts`, `src/types/market.ts`, `src/app/market/[slug]/page.tsx` |
| **Do not regress** | Always parse and surface Apify error responses — never fail silently |
| **Verify** | `npm run doctor` reports stuck runs; STR tab shows error banner on 402 |

### FIX-004: Investment Returns & Safety sections blank

| Field | Detail |
|---|---|
| **Date** | 2026-06-23 |
| **Symptom** | Score hero `—` for Investment Returns/Safety; sections hidden as "No data available" |
| **Cause** | Cap rate required STR only; FBI key empty + wrong URL; `MetricsSection` hid cards when all signals gray |
| **Fix** | LTR fallback in `calculations.ts`; `state-tax-rates.ts`; FBI year-range URL; always render metrics; Investment Returns on Overview |
| **Files** | `src/lib/calculations.ts`, `src/lib/state-tax-rates.ts`, `src/lib/api/fbi-crime.ts`, `src/components/dashboard/metrics-section.tsx`, `src/app/market/[slug]/page.tsx` |
| **Do not regress** | Investment metrics must work without STR data; metrics sections must show N/A values |
| **Verify** | `/api/analyze?city=Austin&state=TX` returns `capRateEstimate` and `stateTaxRate` without STR |

### FIX-005: Silent STR failures in UI

| Field | Detail |
|---|---|
| **Date** | 2026-06-23 |
| **Symptom** | Spinner stops, STR tab still empty, no user-visible explanation |
| **Cause** | Client swallowed non-OK responses; no error field on snapshot |
| **Fix** | `strFetchError` on snapshot; amber banner on STR tab; `npm run doctor` pre-flight script |
| **Files** | `src/lib/api/apify-str.ts`, `src/app/market/[slug]/page.tsx`, `scripts/doctor.mjs`, `package.json` |
| **Do not regress** | STR fetch errors must always reach the UI or doctor output |
| **Verify** | `npm run doctor` passes; invalid token shows banner on STR tab |

### FIX-006: Safety & Quality metrics all N/A

| Field | Detail |
|---|---|
| **Date** | 2026-06-23 |
| **Symptom** | Safety & Quality section shows N/A for crime, property tax; only state income tax loads |
| **Cause** | `FBI_API_KEY` empty with no fallback; `propertyTaxRate` never populated; Walk Score API not wired |
| **Fix** | Static FBI 2022 state crime estimates + Census property tax rates; `enrichSafetyFields()` backfills cached snapshots; Walk Score fetcher when `WALKSCORE_API_KEY` set |
| **Files** | `src/lib/state-crime-rates.ts`, `src/lib/state-property-tax-rates.ts`, `src/lib/safety-enrichment.ts`, `src/lib/api/walkscore.ts`, `src/lib/api/fbi-crime.ts`, `src/app/api/analyze/route.ts`, `scripts/doctor.mjs` |
| **Do not regress** | Crime and property tax must load without optional API keys; cached snapshots must be enriched on read |
| **Verify** | `curl "http://localhost:3000/api/analyze?city=Austin&state=TX"` returns `crimeRateViolent`, `propertyTaxRate` with non-null values |

### FIX-007: STR latency — listing cap, snapshot guard, two-phase fetch

| Field | Detail |
|---|---|
| **Date** | 2026-06-23 |
| **Symptom** | First STR load takes 1–2 minutes; repeat visits or refresh could re-hit Apify unnecessarily |
| **Cause** | Default 5 listings × ~30–40s each; sync-only fetch; `/api/analyze/str` always called Apify even when snapshot had STR data |
| **Fix** | Default `APIFY_STR_MAX_LISTINGS=3`; snapshot guard returns cached STR when `strLoadComplete` (or quick preview when `phase=quick`); two-phase client flow (`phase=quick` then `phase=full` in background); `strLoadComplete` on snapshot |
| **Files** | `src/lib/api/apify-str.ts`, `src/app/api/analyze/str/route.ts`, `src/app/market/[slug]/page.tsx`, `src/types/market.ts`, `.env.example`, `scripts/doctor.mjs`, `plan.md` §9.1 |
| **Do not regress** | Never block `/api/analyze` on Apify; never raise default listing count without updating latency docs; always guard STR route against redundant Apify calls when snapshot is complete |
| **Verify** | `npm run doctor`; first STR visit shows preview ~30s then refines; second visit skips Apify (`cached: true` on STR curl without `refresh=true`) |

### FIX-008: Investment Brief fails — Zod `.optional()` on structured output

| Field | Detail |
|---|---|
| **Date** | 2026-06-24 |
| **Symptom** | Investment Brief fails to generate; OpenAI API rejects schema: `properties/explain` uses `.optional()` without `.nullable()` |
| **Cause** | `marketBriefExplainSchema` used `.optional()` on `explain`; OpenAI structured outputs require all fields in `required` (use `.nullable()` or omit the field) |
| **Fix** | Brief mode uses `marketBriefSchema` (no `explain` field); explain mode uses `marketBriefExplainSchema` with required `explain` array |
| **Files** | `src/lib/agent/schemas.ts`, `src/lib/agent/service.ts`, `src/lib/agent/types.ts`, `src/lib/__tests__/agent-cache.test.ts` |
| **Do not regress** | Never use `.optional()` on Zod schemas passed to `zodResponseFormat`; use separate schemas or `.nullable()` |
| **Verify** | `npm test`; `curl "http://localhost:3000/api/agent/brief?city=Austin&state=TX"` returns JSON brief |

### FIX-009: Explain my score silent failure / wipes brief on error

| Field | Detail |
|---|---|
| **Date** | 2026-06-24 |
| **Symptom** | "Explain my score" appears to do nothing, or replaces the whole brief with an error |
| **Cause** | Explain fetch errors called `setError` on the whole card; legacy explain cache entries lacked `explain` array; no loading/error UI for explain mode |
| **Fix** | Separate `explainSections` / `explainError` state in UI; invalidate stale explain cache via `hasExplainSections`; clearer explain prompt listing `facts.categories` |
| **Files** | `src/components/dashboard/market-brief-card.tsx`, `src/lib/agent/cache.ts`, `src/lib/agent/service.ts`, `src/lib/agent/prompts.ts`, `src/lib/__tests__/agent-cache.test.ts` |
| **Do not regress** | Explain failures must not clear the loaded brief; explain cache must require non-empty `explain` array |
| **Verify** | `npm test`; load brief, click Explain my score — shows spinner then category breakdown; API error shows inline retry without losing brief |

### FIX-010: Discovery parse fails — Zod `.optional()` on structured output

| Field | Detail |
|---|---|
| **Date** | 2026-06-26 |
| **Symptom** | Discover markets fails at parse step; OpenAI rejects schema: `properties/statesInclude` uses `.optional()` without `.nullable()` |
| **Cause** | `discoveryCriteriaSchema` used `.optional()` on filter fields; OpenAI structured outputs require all properties in `required` (use `.nullable()` for unset filters) |
| **Fix** | Replaced `.optional()` with `.nullable()` on all optional discovery criteria fields; prompt instructs model to return `null` for unset filters |
| **Files** | `src/lib/agent/discovery/schemas.ts`, `types.ts`, `prompts.ts`, `filter-metros.ts`, `src/lib/__tests__/discovery.test.ts` |
| **Do not regress** | Never use `.optional()` on Zod schemas passed to `zodResponseFormat`; use `.nullable()` for optional LLM fields (see FIX-008) |
| **Verify** | `npm test`; `curl -X POST http://localhost:3000/api/agent/discover -H 'Content-Type: application/json' -d '{"query":"Texas markets under 400k"}'` returns ranked results |

<!-- FIX-LOG:END -->

### Summary (quick reference)

The fix log entries above correspond to these guardrails:

1. **Storage** — snapshots on disk, not in-memory
2. **STR timing** — async `/api/analyze/str`, no short race; two-phase quick→full
3. **Apify 402** — auto-abort stuck runs + user-visible errors
4. **Partial data** — LTR fallbacks + always-show metrics
5. **Observability** — doctor script + STR error banner
6. **STR latency** — default 3 listings; snapshot guard; never re-scrape when `strLoadComplete`

---

## Required configuration (`.env.local`)

Copy from `.env.example` and fill in:

```env
# Required for STR data
APIFY_API_TOKEN=          # https://console.apify.com/account/integrations

# Recommended Apify tuning (free tier)
APIFY_STR_MAX_LISTINGS=3
APIFY_RUN_TIMEOUT_SECS=300
APIFY_CLIENT_TIMEOUT_MS=330000

# STR cost control — false = Apify only when user clicks "Load STR Data" on the STR tab
NEXT_PUBLIC_APIFY_STR_AUTO_FETCH=false

# Optional — improves crime data on Safety tab (static state estimates used when empty)
FBI_API_KEY=              # https://api.data.gov/signup/  (free)

# Optional — government APIs (app works with fallbacks but keys improve limits)
BEA_API_KEY=
CENSUS_API_KEY=
BLS_API_KEY=

# Optional — AI agent (Market Brief + Compare & Rank; app works without it)
OPENAI_API_KEY=           # https://platform.openai.com/api-keys
OPENAI_MODEL=gpt-4o-mini  # override to gpt-4o for higher quality
AGENT_ENABLED=true        # set false to disable agent API routes
```

### Apify listing cap (automatic)

Even if `APIFY_STR_MAX_LISTINGS=20`, the app caps listings to `floor(APIFY_RUN_TIMEOUT_SECS / 35)` so the actor can finish within the timeout. At 300s → max **8 listings**.

---

## Pre-flight checklist (`npm run doctor`)

Run before demoing or after pulling changes:

- [ ] `npm test` passes (regression suite — no API keys required)
- [ ] `.env.local` exists
- [ ] `APIFY_API_TOKEN` is set (non-empty)
- [ ] `.data/` directory is writable
- [ ] No stuck Apify runs (or doctor reports count)
- [ ] Dev server responds at `http://localhost:3000`

---

## Troubleshooting

| Problem | Check | Action |
|---|---|---|
| STR tab all N/A, fast (&lt;2s) | Server terminal | Look for `402` or `APIFY_API_TOKEN not set` |
| STR tab spinner forever | Apify console | Abort stuck runs; reduce `APIFY_STR_MAX_LISTINGS` to 3 |
| STR re-fetches on every visit | STR curl response | Should return `cached: true` when snapshot has `strLoadComplete`; check `refresh=true` not set |
| Apify usage when not using STR tab | `.env.local` | Keep `NEXT_PUBLIC_APIFY_STR_AUTO_FETCH=false` (default); use **Load STR Data** on the STR tab |
| STR worked once, now empty after restart | `.data/snapshots.json` | Should persist — if missing, re-analyze city |
| Crime always N/A | Server code / cache | Re-fetch market; crime falls back to FBI 2022 state estimates without `FBI_API_KEY` |
| Walk Score N/A | `.env.local` | Set `WALKSCORE_API_KEY` (free at walkscore.com/professional/api.php) |
| Old city missing new STR fields | Cached snapshot | Click **Re-fetch Data** on market dashboard |
| Old city missing regulation fields | Cached snapshot | Re-fetch market or open Compare (finalize-snapshot re-applies regulation) |
| Regulation shows state default for known city | Missing city override | Run `npm run regulation:coverage`; add seed and `npm run regulation:sync` |
| Savannah shows Friendly | Pre-v2 snapshot | Re-fetch — Savannah now has restrictive city override with STVR sources |
| Investment Brief shows setup message | `.env.local` | Set `OPENAI_API_KEY`; run `npm run doctor` — dashboard works without it |
| Investment Brief API/schema error | Agent Zod schema | OpenAI structured output rejects `.optional()` fields — brief uses `marketBriefSchema`; explain mode adds required `explain` array (see FIX-008) |
| Explain my score does nothing | Agent cache / UI | Stale explain cache without `explain` array is auto-invalidated (FIX-009); click **Retry explanation** if inline error shows |
| Compare & Rank returns 503 | `.env.local` | Same as above; comparison table still works |
| Discover markets returns 503 | `.env.local` / schema | Set `OPENAI_API_KEY`; ensure `DISCOVERY_ENABLED` is not `false`. Schema errors from `.optional()` Zod fields — use `.nullable()` (FIX-010) |
| Discovery returns no results | Strict criteria | Widen budget, occupancy, or state filters; discovery searches 73 metros with regulation pre-filter |
| Discovery slow or times out | Hydrate cap | Default max 25 new metro fetches per run; cached snapshots are fast — analyze cities first or raise `DISCOVERY_MAX_HYDRATE` |
| Production shows login loop | Vercel env | Set `SITE_PASSWORD` on Production; redeploy after env changes |
| API returns 401 in production | Site gate | Sign in at `/login` first, or pass auth cookie with curl |
| Brief stale after Re-fetch Data | Agent cache | Brief auto-invalidates when snapshot `fetchedAt` is newer; or click **Regenerate** |

### Verify STR API manually

```bash
# 1. Analyze (fast)
curl "http://localhost:3000/api/analyze?city=Austin&state=TX&refresh=true"

# 2. STR (slow — wait 1–3 min)
curl "http://localhost:3000/api/analyze/str?city=Austin&state=TX&refresh=true"
```

Expect `strAdr`, `strActiveListings`, and `strError: null` in the JSON response.

### Verify AI agent manually

```bash
# Requires OPENAI_API_KEY in .env.local
curl "http://localhost:3000/api/agent/brief?city=Austin&state=TX"

curl -X POST http://localhost:3000/api/agent/rank \
  -H "Content-Type: application/json" \
  -d '{"snapshotIds":["id1","id2"],"profile":{"maxPurchasePrice":500000}}'
```

---

## File reference

| File | Role |
|---|---|
| `src/lib/storage.ts` | Snapshot persistence (`.data/snapshots.json`) |
| `src/lib/api/apify-str.ts` | Apify actor, aggregation, abort/retry, error messages |
| `src/app/api/analyze/route.ts` | Fast government-data fetch |
| `src/app/api/analyze/str/route.ts` | Slow STR fetch (`maxDuration = 300`) |
| `src/app/market/[slug]/page.tsx` | Two-phase client load + STR error banner |
| `src/lib/calculations.ts` | LTR fallback for cap rate / cash-on-cash |
| `src/lib/state-tax-rates.ts` | Static state income tax for Safety tab |
| `src/lib/state-crime-rates.ts` | FBI 2022 state crime fallback (no API key required) |
| `src/data/str-regulations.json` | Curated STR regulation dataset (state defaults + city overrides) |
| `src/lib/str-regulations.ts` | Regulation lookup, investor eligibility, snapshot enrichment |
| `src/lib/thresholds.ts` | Metric scoring, regulation category, decision gates |
| `src/lib/finalize-snapshot.ts` | Re-score saved snapshots on compare page load |
| `src/lib/agent/` | AI agent — brief, rank, cache, deterministic pre-rank |
| `src/app/api/agent/brief/route.ts` | GET investment brief (OpenAI structured output) |
| `src/app/api/agent/rank/route.ts` | POST compare & rank |
| `.data/agent-cache.json` | Cached briefs and rank results (gitignored) |
| `src/lib/state-property-tax-rates.ts` | Census effective property tax rates by state |
| `src/lib/safety-enrichment.ts` | Backfills Safety fields on cached snapshots |
| `src/lib/api/fbi-crime.ts` | FBI live API with static state fallback |
| `src/lib/api/walkscore.ts` | Walk/transit scores when `WALKSCORE_API_KEY` set |
| `scripts/doctor.mjs` | Startup pre-flight checks |

---

## Production notes (future)

When moving beyond local prototype:

1. Replace `.data/snapshots.json` with Supabase (per original plan).
2. Run Apify as a background job (queue/webhook) instead of blocking HTTP.
3. Store STR cache in DB, not in-memory `cache.ts` (same worker issue).
4. Set `maxDuration` on Vercel Pro for `/api/analyze/str` if deploying serverless.

---

## Deploy to Vercel (Hobby + shared password)

> **Live deployment details:** see [DEPLOYMENT.md](./DEPLOYMENT.md) (production URL, Vercel project, verify steps).

The app ships with an optional **site gate** — no Vercel Pro password add-on required.

### 1. Environment variables

Set in Vercel → Project → Settings → Environment Variables (Production + Preview):

| Variable | Required | Notes |
|---|---|---|
| `SITE_PASSWORD` | **Yes** (production) | Shared password visitors enter at `/login` |
| `SITE_AUTH_SECRET` | Recommended | Long random string for cookie signing; falls back to `SITE_PASSWORD` if empty |
| `APIFY_API_TOKEN` | For STR tab | Same as local |
| `OPENAI_API_KEY` | For Market Brief | Optional |
| Other keys | Optional | Copy from `.env.example` |

Leave `SITE_PASSWORD` **empty locally** for open access during development.

### 2. Deploy

```bash
cd market-analyzer
npm run build
npx vercel          # preview
npx vercel --prod   # production URL
```

Set **Root Directory** to `market-analyzer` if importing from the monorepo GitHub repo.

### 3. Verify the gate

1. Open the production URL — you should land on `/login`.
2. Enter `SITE_PASSWORD` — redirects to home.
3. `curl https://your-app.vercel.app/api/analyze?city=Austin&state=TX` without a cookie → `401 Unauthorized`.

### 4. Hobby limitations

- **Snapshots / agent cache** use `.data/` on disk — ephemeral on serverless; users may need to re-analyze after cold starts.
- **STR fetch** (`maxDuration = 300`) may hit Hobby’s function timeout (~10s). Government data and UI still work; STR may fail or time out without Vercel Pro.

### Files

| File | Role |
|---|---|
| `src/middleware.ts` | Redirects unauthenticated users to `/login`; blocks API with 401 |
| `src/lib/site-auth.ts` | Password check + signed cookie token |
| `src/app/login/page.tsx` | Shared-password sign-in |
| `src/app/api/auth/login/route.ts` | Sets httpOnly auth cookie |

---

## Adding new fixes

1. Read the next ID from the last `FIX-NNN` entry in the [Fix Log](#fix-log) above.
2. Copy the template from [plan.md §14](./plan.md#14-issue-resolution--fix-capture-protocol).
3. Append between `<!-- FIX-LOG:START -->` and `<!-- FIX-LOG:END -->`.
4. Update the [Troubleshooting](#troubleshooting) table if users might hit this again.
5. Run `npm run doctor` and note verification steps in the entry.
