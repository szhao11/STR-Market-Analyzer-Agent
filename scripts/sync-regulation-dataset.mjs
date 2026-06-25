#!/usr/bin/env node
/**
 * Merge regulation seeds into str-regulations.json and add county to metros.json.
 * Usage: node scripts/sync-regulation-dataset.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { citySeeds, countySeeds, cbsaSeeds, metroCounties } from "./regulation-seeds.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const regulationsPath = path.join(root, "src", "data", "str-regulations.json");
const metrosPath = path.join(root, "src", "data", "metros.json");

const existing = JSON.parse(fs.readFileSync(regulationsPath, "utf8"));

const dataset = {
  version: "2026-06-02",
  stateDefaults: existing.stateDefaults,
  countyOverrides: countySeeds,
  cbsaOverrides: cbsaSeeds,
  cityOverrides: citySeeds,
};

fs.writeFileSync(regulationsPath, `${JSON.stringify(dataset, null, 2)}\n`);

const metros = JSON.parse(fs.readFileSync(metrosPath, "utf8"));
let missingCounty = 0;
for (const metro of metros) {
  const key = `${metro.city}|${metro.stateAbbr}`;
  const county = metroCounties[key];
  if (county) {
    metro.county = county;
  } else {
    missingCounty++;
    console.warn(`Warning: no county mapping for ${key}`);
  }
}
fs.writeFileSync(metrosPath, `${JSON.stringify(metros, null, 2)}\n`);

console.log(
  `Synced regulation dataset v${dataset.version}: ${citySeeds.length} cities, ${countySeeds.length} counties, ${cbsaSeeds.length} CBSAs`
);
if (missingCounty > 0) {
  process.exit(1);
}
