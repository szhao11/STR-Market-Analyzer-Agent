#!/usr/bin/env node
/**
 * Validate regulation dataset coverage and source requirements.
 * Usage: node scripts/regulation-coverage.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const regulationsPath = path.join(root, "src", "data", "str-regulations.json");
const metrosPath = path.join(root, "src", "data", "metros.json");

const metros = JSON.parse(fs.readFileSync(metrosPath, "utf8"));
const dataset = JSON.parse(fs.readFileSync(regulationsPath, "utf8"));

const cityKeys = new Set(
  (dataset.cityOverrides ?? []).map((e) => `${e.city}|${e.stateAbbr}`.toLowerCase())
);

const gaps = [];
for (const metro of metros) {
  const key = `${metro.city}|${metro.stateAbbr}`.toLowerCase();
  if (!cityKeys.has(key)) {
    gaps.push(`${metro.city}, ${metro.stateAbbr}`);
  }
  if (!metro.county) {
    gaps.push(`${metro.city}, ${metro.stateAbbr} (missing county)`);
  }
}

const highWithoutSources = (dataset.cityOverrides ?? []).filter(
  (e) => e.confidence === "high" && (!e.sources || e.sources.length === 0)
);

const countyHighWithoutSources = (dataset.countyOverrides ?? []).filter(
  (e) => e.confidence === "high" && (!e.sources || e.sources.length === 0)
);

console.log("\nRegulation coverage report\n");
console.log(`Metros in app:        ${metros.length}`);
console.log(`City overrides:       ${(dataset.cityOverrides ?? []).length}`);
console.log(`County overrides:     ${(dataset.countyOverrides ?? []).length}`);
console.log(`CBSA overrides:       ${(dataset.cbsaOverrides ?? []).length}`);
console.log(`State defaults:       ${Object.keys(dataset.stateDefaults ?? {}).length}`);
console.log(`Dataset version:      ${dataset.version}`);

if (gaps.length > 0) {
  console.log(`\n✗ Coverage gaps (${gaps.length}):`);
  for (const g of gaps) console.log(`  - ${g}`);
} else {
  console.log("\n✓ Every metro has a city override and county field");
}

if (highWithoutSources.length > 0) {
  console.log(`\n✗ High-confidence city entries missing sources (${highWithoutSources.length}):`);
  for (const e of highWithoutSources) {
    console.log(`  - ${e.city}, ${e.stateAbbr}`);
  }
} else {
  console.log("\n✓ All high-confidence city overrides have official sources");
}

if (countyHighWithoutSources.length > 0) {
  console.log(`\n✗ High-confidence county entries missing sources (${countyHighWithoutSources.length}):`);
  for (const e of countyHighWithoutSources) {
    console.log(`  - ${e.county}, ${e.stateAbbr}`);
  }
} else {
  console.log("✓ All high-confidence county overrides have official sources");
}

const lowConfidence = (dataset.cityOverrides ?? []).filter((e) => e.confidence === "low");
if (lowConfidence.length > 0) {
  console.log(`\n! ${lowConfidence.length} city entries at low confidence (verify locally):`);
  for (const e of lowConfidence) {
    console.log(`  - ${e.city}, ${e.stateAbbr}`);
  }
}

console.log("");
process.exit(gaps.length > 0 || highWithoutSources.length > 0 || countyHighWithoutSources.length > 0 ? 1 : 0);
