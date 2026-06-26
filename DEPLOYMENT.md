# Production Deployment

Live deployment record and runbook for the STR Market Analyzer on **Vercel Hobby** with a shared-password site gate.

**Related:** [plan.md §17](./plan.md#17-production-deployment) · [PROTOTYPE-OPERATIONS.md](./PROTOTYPE-OPERATIONS.md) · [README.md](./README.md)

---

## Live site

| | |
|---|---|
| **Production URL** | https://market-analyzer-lovat.vercel.app |
| **Login** | `/login` — shared password (`SITE_PASSWORD` in Vercel) |
| **Platform** | Vercel Hobby |
| **First deployed** | 2026-06-25 |
| **Vercel project** | `side-project-prototypes/market-analyzer` |
| **Vercel dashboard** | https://vercel.com/side-project-prototypes/market-analyzer |
| **GitHub repo** | https://github.com/szhao11/STR-Market-Analyzer-Agent |
| **App root** | `market-analyzer/` (set as Root Directory if importing from monorepo) |

> **Password:** Stored only in Vercel → Project → Settings → Environment Variables → `SITE_PASSWORD`. Do not commit it to git. Rotate there and redeploy if needed.

---

## Access control (site gate)

No Vercel Pro password add-on. Auth is implemented in-app:

| File | Role |
|---|---|
| `src/middleware.ts` | Redirects unauthenticated traffic to `/login`; API routes return `401` |
| `src/lib/site-auth.ts` | Password verification + HMAC-signed cookie token |
| `src/app/login/page.tsx` | Shared-password sign-in UI |
| `src/app/api/auth/login/route.ts` | Sets httpOnly session cookie (30 days) |

**Behavior**

- `SITE_PASSWORD` **set** (production) → all pages and APIs require login.
- `SITE_PASSWORD` **empty** (typical local dev) → open access, no gate.

---

## Environment variables (Vercel Production)

Set in Vercel → **Settings** → **Environment Variables**.

| Variable | Required | Notes |
|---|---|---|
| `SITE_PASSWORD` | **Yes** (production) | Shared password for `/login` |
| `SITE_AUTH_SECRET` | Recommended | Random string for cookie signing; defaults to `SITE_PASSWORD` if empty |
| `APIFY_API_TOKEN` | For STR tab | https://console.apify.com/account/integrations |
| `OPENAI_API_KEY` | For Market Brief / Rank | Optional — app works without agent |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini` |
| `AGENT_ENABLED` | Optional | Default `true` |
| `BEA_API_KEY` | Optional | Government APIs; fallbacks exist |
| `CENSUS_API_KEY` | Optional | |
| `BLS_API_KEY` | Optional | |
| `FBI_API_KEY` | Optional | State crime fallback without it |
| `WALKSCORE_API_KEY` | Optional | |
| `APIFY_STR_MAX_LISTINGS` | Optional | Default `3` |
| `APIFY_RUN_TIMEOUT_SECS` | Optional | Default `300` |
| `APIFY_CLIENT_TIMEOUT_MS` | Optional | |
| `NEXT_PUBLIC_APIFY_STR_AUTO_FETCH` | Optional | Keep `false` to avoid auto Apify on page load |

Copy the full list from [`.env.example`](./.env.example).

---

## Deploy and redeploy

From the app directory:

```bash
cd market-analyzer
npm test
npm run build
npx vercel          # preview deployment
npx vercel --prod   # production
```

**After changing env vars in Vercel**, redeploy production so functions pick up new values:

```bash
npx vercel --prod
```

**CLI project link** (first time on a new machine):

```bash
npx vercel link
```

`.vercel/project.json` is gitignored; each developer links locally or imports via the Vercel dashboard.

---

## Verify deployment

1. Open https://market-analyzer-lovat.vercel.app — should redirect to `/login`.
2. Sign in with `SITE_PASSWORD`.
3. Search a city; Overview tab should load government data in ~1–3s.
4. API gate (no cookie):

```bash
curl -s "https://market-analyzer-lovat.vercel.app/api/analyze?city=Austin&state=TX"
# → {"error":"Unauthorized"}
```

5. API after login (save cookie from browser devtools or POST to `/api/auth/login`).

---

## Hobby plan limitations

| Area | Impact |
|---|---|
| **Snapshots / agent cache** | `.data/` on disk is ephemeral on serverless — users may re-analyze after cold starts or redeploys |
| **STR fetch** | `/api/analyze/str` uses `maxDuration = 300`; Hobby function timeout ~10s — STR may fail or time out without **Vercel Pro** |
| **Apify usage** | Same token as local; keep `NEXT_PUBLIC_APIFY_STR_AUTO_FETCH=false` unless you intend auto-scraping |

**Future production hardening** (see [PROTOTYPE-OPERATIONS.md § Production notes](./PROTOTYPE-OPERATIONS.md)):

1. Supabase for durable snapshots (replacing `.data/snapshots.json`)
2. Background Apify jobs instead of blocking HTTP
3. Vercel Pro for long-running STR routes

---

## Change the shared password

1. Vercel → **market-analyzer** → **Settings** → **Environment Variables**
2. Update `SITE_PASSWORD` (and optionally `SITE_AUTH_SECRET`)
3. Run `npx vercel --prod` from `market-analyzer/`
4. Existing cookies signed with the old secret will stop working — users sign in again

---

## Troubleshooting

| Problem | Action |
|---|---|
| Login loop / instant redirect | Confirm `SITE_PASSWORD` is set on **Production** env; redeploy |
| API `401` after login | Clear cookies; sign in again; check `SITE_AUTH_SECRET` wasn’t changed without redeploy |
| STR tab always errors | Expected on Hobby — timeout; upgrade to Pro or use local dev for full STR |
| Empty recent markets after redeploy | Expected — ephemeral storage until Supabase migration |

See also [PROTOTYPE-OPERATIONS.md → Troubleshooting](./PROTOTYPE-OPERATIONS.md#troubleshooting).
