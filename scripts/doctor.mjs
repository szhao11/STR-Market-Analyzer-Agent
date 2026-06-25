#!/usr/bin/env node
/**
 * Pre-flight checks before running the prototype.
 * Usage: npm run doctor
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");
const dataDir = path.join(root, ".data");

const results = [];
let failed = false;

function pass(msg) {
  results.push({ ok: true, msg });
}
function fail(msg) {
  results.push({ ok: false, msg });
  failed = true;
}
function warn(msg) {
  results.push({ ok: "warn", msg });
}

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    fail(".env.local missing — copy .env.example and add your API keys");
    return {};
  }
  pass(".env.local found");

  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function checkEnv(env) {
  if (env.APIFY_API_TOKEN) {
    pass(`APIFY_API_TOKEN set (${env.APIFY_API_TOKEN.length} chars)`);
  } else {
    fail("APIFY_API_TOKEN is empty — STR Data tab will not load");
  }

  if (env.FBI_API_KEY) {
    pass("FBI_API_KEY set (live crime API enabled)");
  } else {
    warn("FBI_API_KEY empty — crime metrics use static FBI 2022 state estimates");
  }

  if (env.WALKSCORE_API_KEY) {
    pass("WALKSCORE_API_KEY set");
  } else {
    warn("WALKSCORE_API_KEY empty — walk/transit scores will show N/A");
  }

  const maxListings = Number(env.APIFY_STR_MAX_LISTINGS ?? "3");
  const runTimeout = Number(env.APIFY_RUN_TIMEOUT_SECS ?? "300");
  const cap = Math.max(1, Math.floor(runTimeout / 35));
  if (maxListings > cap) {
    warn(
      `APIFY_STR_MAX_LISTINGS=${maxListings} exceeds safe cap of ${cap} for ${runTimeout}s timeout — app will auto-limit`
    );
  } else {
    pass(`Apify listing config OK (max ${maxListings}, timeout ${runTimeout}s)`);
  }

  if (!env.APIFY_CLIENT_TIMEOUT_MS) {
    warn("APIFY_CLIENT_TIMEOUT_MS not set — defaults to run timeout + 30s");
  }

  if (env.OPENAI_API_KEY) {
    pass(`OPENAI_API_KEY set (${env.OPENAI_API_KEY.length} chars)`);
    pass(`OpenAI model: ${env.OPENAI_MODEL || "gpt-4o-mini (default)"}`);
  } else {
    warn("OPENAI_API_KEY empty — Market Brief and Compare & Rank will show setup message");
  }

  if (env.AGENT_ENABLED === "false") {
    warn("AGENT_ENABLED=false — agent API routes return 503");
  } else {
    pass("AI agent enabled (AGENT_ENABLED not false)");
  }

  const strAutoFetch = env.NEXT_PUBLIC_APIFY_STR_AUTO_FETCH === "true";
  if (strAutoFetch) {
    warn(
      "NEXT_PUBLIC_APIFY_STR_AUTO_FETCH=true — Apify runs automatically when opening market pages"
    );
  } else {
    pass("STR on-demand mode (NEXT_PUBLIC_APIFY_STR_AUTO_FETCH not true — Apify only when user clicks Load STR Data)");
  }
}

function checkStorage() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const testFile = path.join(dataDir, ".write-test");
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    pass(".data/ directory writable");

    const snapshotsFile = path.join(dataDir, "snapshots.json");
    if (fs.existsSync(snapshotsFile)) {
      const snapshots = JSON.parse(fs.readFileSync(snapshotsFile, "utf8"));
      pass(`snapshots.json exists (${snapshots.length} saved market(s))`);
    } else {
      pass("snapshots.json not yet created (normal on first run)");
    }
  } catch (err) {
    fail(`.data/ not writable: ${err.message}`);
  }
}

async function checkApify(env) {
  if (!env.APIFY_API_TOKEN) return;

  try {
    const res = await fetch(
      `https://api.apify.com/v2/actor-runs?token=${env.APIFY_API_TOKEN}&status=RUNNING&limit=20`
    );
    if (!res.ok) {
      warn(`Could not check Apify runs (HTTP ${res.status})`);
      return;
    }
    const json = await res.json();
    const running = json?.data?.items?.length ?? 0;
    if (running > 0) {
      warn(
        `${running} Apify actor run(s) still RUNNING — may block new STR fetches. Abort at console.apify.com/actors/runs`
      );
    } else {
      pass("No stuck Apify actor runs");
    }
  } catch {
    warn("Could not reach Apify API (network)");
  }
}

async function checkDevServer() {
  try {
    const res = await fetch("http://localhost:3000/api/snapshots", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      pass("Dev server responding at localhost:3000");
    } else {
      warn(`Dev server returned HTTP ${res.status} — run npm run dev`);
    }
  } catch {
    warn("Dev server not running — start with npm run dev");
  }
}

function checkRegulationDataset() {
  const datasetPath = path.join(root, "src", "data", "str-regulations.json");
  const metrosPath = path.join(root, "src", "data", "metros.json");
  if (!fs.existsSync(datasetPath)) {
    fail("str-regulations.json missing — STR regulation scoring will not work");
    return;
  }

  try {
    const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
    const metros = JSON.parse(fs.readFileSync(metrosPath, "utf8"));
    const stateCount = Object.keys(dataset.stateDefaults ?? {}).length;
    const cityCount = (dataset.cityOverrides ?? []).length;
    const countyCount = (dataset.countyOverrides ?? []).length;
    const cbsaCount = (dataset.cbsaOverrides ?? []).length;

    const cityKeys = new Set(
      (dataset.cityOverrides ?? []).map((e) => `${e.city}|${e.stateAbbr}`.toLowerCase())
    );
    const metroGaps = metros.filter(
      (m) => !cityKeys.has(`${m.city}|${m.stateAbbr}`.toLowerCase())
    );
    const missingCounty = metros.filter((m) => !m.county);

    const highNoSources = (dataset.cityOverrides ?? []).filter(
      (e) => e.confidence === "high" && (!e.sources || e.sources.length === 0)
    );

    pass(
      `str-regulations.json v${dataset.version} (${cityCount} cities, ${countyCount} counties, ${cbsaCount} CBSAs, ${stateCount} states)`
    );

    if (metroGaps.length > 0) {
      fail(`${metroGaps.length} metro(s) missing city override — run npm run regulation:sync`);
    } else {
      pass(`City override coverage: ${metros.length}/${metros.length} metros`);
    }

    if (missingCounty.length > 0) {
      warn(`${missingCounty.length} metro(s) missing county field`);
    }

    if (highNoSources.length > 0) {
      fail(
        `${highNoSources.length} high-confidence override(s) missing sources — add .gov URLs or lower confidence`
      );
    } else {
      pass("All high-confidence overrides have official sources");
    }
  } catch (err) {
    fail(`str-regulations.json invalid: ${err.message}`);
  }
}

async function main() {
  console.log("\nSTR Market Analyzer — pre-flight checks\n");

  const env = loadEnv();
  checkEnv(env);
  checkRegulationDataset();
  checkStorage();
  await checkApify(env);
  await checkDevServer();

  for (const r of results) {
    const icon = r.ok === true ? "✓" : r.ok === "warn" ? "!" : "✗";
    const color = r.ok === true ? "\x1b[32m" : r.ok === "warn" ? "\x1b[33m" : "\x1b[31m";
    console.log(`${color}${icon}\x1b[0m ${r.msg}`);
  }

  console.log("");
  if (failed) {
    console.log("Fix the ✗ items above before expecting STR data to load.\n");
    process.exit(1);
  }
  console.log("Ready to run. Start with: npm run dev\n");
}

main();
