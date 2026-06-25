// FBI UCR 2022 state-level estimates (per 100k). Used when FBI API key is absent or unavailable.
// Violent: FBI Crime in the Nation 2022. Property: FBI CIUS Table 5 state estimates.
export interface StateCrimeRates {
  violent: number;
  property: number;
}

const STATE_CRIME_RATES: Record<string, StateCrimeRates> = {
  AL: { violent: 409, property: 2148 },
  AK: { violent: 759, property: 2548 },
  AZ: { violent: 432, property: 2489 },
  AR: { violent: 645, property: 3097 },
  CA: { violent: 500, property: 2843 },
  CO: { violent: 493, property: 3640 },
  CT: { violent: 150, property: 1644 },
  DE: { violent: 384, property: 2348 },
  DC: { violent: 812, property: 3184 },
  FL: { violent: 259, property: 1825 },
  GA: { violent: 367, property: 2058 },
  HI: { violent: 260, property: 2694 },
  ID: { violent: 241, property: 1168 },
  IL: { violent: 287, property: 1970 },
  IN: { violent: 306, property: 1850 },
  IA: { violent: 287, property: 1618 },
  KS: { violent: 415, property: 2407 },
  KY: { violent: 214, property: 1663 },
  LA: { violent: 629, property: 3377 },
  ME: { violent: 103, property: 1317 },
  MD: { violent: 399, property: 2034 },
  MA: { violent: 322, property: 1392 },
  MI: { violent: 461, property: 1998 },
  MN: { violent: 281, property: 2247 },
  MS: { violent: 245, property: 1992 },
  MO: { violent: 488, property: 2828 },
  MT: { violent: 418, property: 2337 },
  NE: { violent: 283, property: 2172 },
  NV: { violent: 454, property: 2834 },
  NH: { violent: 126, property: 1137 },
  NJ: { violent: 203, property: 1620 },
  NM: { violent: 781, property: 3765 },
  NY: { violent: 429, property: 2151 },
  NC: { violent: 405, property: 2469 },
  ND: { violent: 280, property: 2274 },
  OH: { violent: 294, property: 2076 },
  OK: { violent: 420, property: 2752 },
  OR: { violent: 342, property: 3278 },
  PA: { violent: 280, property: 1762 },
  RI: { violent: 172, property: 1458 },
  SC: { violent: 491, property: 2800 },
  SD: { violent: 377, property: 2114 },
  TN: { violent: 622, property: 2924 },
  TX: { violent: 432, property: 2732 },
  UT: { violent: 242, property: 2137 },
  VT: { violent: 222, property: 1893 },
  VA: { violent: 234, property: 1930 },
  WA: { violent: 376, property: 3732 },
  WV: { violent: 278, property: 1508 },
  WI: { violent: 297, property: 1682 },
  WY: { violent: 202, property: 1839 },
};

export function getStateCrimeRates(stateAbbr: string): StateCrimeRates | null {
  return STATE_CRIME_RATES[stateAbbr.toUpperCase()] ?? null;
}
