/**
 * Curated STR regulation seeds for every metro in metros.json.
 * Official .gov / civic portal URLs where available.
 * Run: node scripts/sync-regulation-dataset.mjs
 */

/** @typedef {'friendly'|'moderate'|'restrictive'|'banned'} Level */
/** @typedef {'high'|'medium'|'low'} Confidence */
/** @typedef {'low'|'moderate'|'active'} Enforcement */

/**
 * @param {object} p
 * @returns {object}
 */
export function seed(
  city,
  stateAbbr,
  {
    overall = "friendly",
    jurisdiction,
    permitRequired = false,
    primaryResidenceOnly = false,
    nightCap = null,
    listingCap = null,
    enforcementLevel = "low",
    summary,
    sources = [],
    confidence = "medium",
    jurisdictionType = "city",
  }
) {
  return {
    city,
    stateAbbr,
    overall,
    jurisdiction: jurisdiction ?? `City of ${city}`,
    jurisdictionType,
    signals: {
      operatingAllowed: overall !== "banned",
      permitRequired,
      primaryResidenceOnly,
      nightCap,
      listingCap,
      enforcementLevel,
    },
    summary,
    sources,
    confidence,
    verifiedAt: "2026-06-01",
  };
}

/** All 74 metros — city-level overrides (mandatory coverage). */
export const citySeeds = [
  seed("New York", "NY", {
    overall: "restrictive",
    jurisdiction: "New York City",
    permitRequired: true,
    enforcementLevel: "active",
    summary:
      "Local Law 18 registration required. Investor STR heavily restricted in many building classes — verify registration and zoning.",
    sources: [
      {
        label: "NYC — Short-Term Rentals",
        url: "https://www.nyc.gov/site/specialenforcement/renters/short-term-rentals.page",
      },
    ],
    confidence: "high",
  }),
  seed("Los Angeles", "CA", {
    overall: "moderate",
    jurisdiction: "City of Los Angeles",
    permitRequired: true,
    nightCap: 120,
    enforcementLevel: "active",
    summary: "Home Sharing Registration required. Non-primary units often capped at 120 hosted nights per year.",
    sources: [
      {
        label: "LA Planning — Home Sharing",
        url: "https://planning.lacity.gov/project-review/home-sharing",
      },
    ],
    confidence: "high",
  }),
  seed("Chicago", "IL", {
    overall: "moderate",
    jurisdiction: "City of Chicago",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Shared housing registration required for STR. Investor operations allowed with registration and taxes.",
    sources: [
      {
        label: "Chicago — Shared Housing",
        url: "https://www.chicago.gov/city/en/depts/bacp/supp_info/shared_housing.html",
      },
    ],
    confidence: "high",
  }),
  seed("Dallas", "TX", {
    overall: "friendly",
    jurisdiction: "City of Dallas",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Hotel occupancy tax and registration required. Non-owner STR generally permitted with compliance.",
    sources: [
      {
        label: "Dallas — Hotel Occupancy Tax",
        url: "https://dallascityhall.com/departments/budget/financial-services/Pages/hotel-occupancy-tax.aspx",
      },
    ],
    confidence: "medium",
  }),
  seed("Houston", "TX", {
    overall: "friendly",
    jurisdiction: "City of Houston",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "No city STR ban. Hotel occupancy tax applies. Verify HOA and deed restrictions.",
    sources: [
      {
        label: "Houston — Hotel Occupancy Tax",
        url: "https://www.houstontx.gov/finance/revenue/hot.html",
      },
    ],
    confidence: "medium",
  }),
  seed("Phoenix", "AZ", {
    overall: "friendly",
    jurisdiction: "City of Phoenix",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "Generally investor-friendly. Transaction privilege/sales tax and licensing may apply.",
    sources: [
      {
        label: "Phoenix — Special Events & Licensing",
        url: "https://www.phoenix.gov/administration/departments/finance/taxation",
      },
    ],
    confidence: "medium",
  }),
  seed("Philadelphia", "PA", {
    overall: "moderate",
    jurisdiction: "City of Philadelphia",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Vacation rental license required. Non-owner STR allowed with license and hotel tax.",
    sources: [
      {
        label: "Philadelphia — Vacation Rental License",
        url: "https://www.phila.gov/services/permits-violations-licenses/get-a-license/business-licenses/vacation-rental-license/",
      },
    ],
    confidence: "high",
  }),
  seed("San Antonio", "TX", {
    overall: "moderate",
    jurisdiction: "City of San Antonio",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental registration required. Type rules vary — verify non-owner eligibility.",
    sources: [
      {
        label: "San Antonio — Short-Term Rentals",
        url: "https://www.sanantonio.gov/Finance/Short-Term-Rental",
      },
    ],
    confidence: "high",
  }),
  seed("San Diego", "CA", {
    overall: "moderate",
    jurisdiction: "City of San Diego",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Transient occupancy registration required. Whole-home STR allowed with TOT compliance.",
    sources: [
      {
        label: "San Diego — Transient Occupancy",
        url: "https://www.sandiego.gov/treasurer/taxesfees/tot",
      },
    ],
    confidence: "high",
  }),
  seed("Austin", "TX", {
    overall: "moderate",
    jurisdiction: "City of Austin",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Type-1 and Type-2 STR permits required. Non-owner (Type-2) allowed with fees and inspections.",
    sources: [
      {
        label: "Austin — Short-Term Rentals",
        url: "https://www.austintexas.gov/department/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Jacksonville", "FL", {
    overall: "friendly",
    jurisdiction: "City of Jacksonville",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "Florida preemption limits local bans. Tourist development tax and business tax receipt may apply.",
    sources: [
      {
        label: "Jacksonville — Tourist Development Tax",
        url: "https://www.coj.net/departments/finance/taxes-and-fees/tourist-development-tax",
      },
    ],
    confidence: "medium",
  }),
  seed("Columbus", "OH", {
    overall: "friendly",
    jurisdiction: "City of Columbus",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "No dedicated STR ban. Verify zoning and collect applicable lodging taxes.",
    sources: [
      {
        label: "Columbus — Income Tax Division",
        url: "https://www.columbus.gov/IncomeTax/",
      },
    ],
    confidence: "low",
  }),
  seed("Charlotte", "NC", {
    overall: "friendly",
    jurisdiction: "City of Charlotte",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "No city-wide STR ban. Mecklenburg County occupancy tax applies. Verify HOA rules.",
    sources: [
      {
        label: "Mecklenburg County — Occupancy Tax",
        url: "https://www.mecknc.gov/Finance/occupancy-tax",
      },
    ],
    confidence: "medium",
  }),
  seed("Indianapolis", "IN", {
    overall: "friendly",
    jurisdiction: "City of Indianapolis",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "Generally permissive for investor STR. Innkeeper's tax and registration may apply.",
    sources: [
      {
        label: "Indianapolis — Innkeeper's Tax",
        url: "https://www.indy.gov/activity/find-innkeepers-tax-forms",
      },
    ],
    confidence: "medium",
  }),
  seed("San Francisco", "CA", {
    overall: "restrictive",
    jurisdiction: "San Francisco",
    permitRequired: true,
    primaryResidenceOnly: true,
    nightCap: 90,
    enforcementLevel: "active",
    summary: "Primary-residence requirement and 90-night cap for unhosted stays. Non-owner investor STR effectively prohibited.",
    sources: [
      { label: "SF Planning — STR", url: "https://sfplanning.org/short-term-rentals" },
    ],
    confidence: "high",
  }),
  seed("Seattle", "WA", {
    overall: "moderate",
    jurisdiction: "City of Seattle",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Business and regulatory licenses required. Non-owner STR permitted with licensing.",
    sources: [
      {
        label: "Seattle — Short-Term Rentals",
        url: "https://www.seattle.gov/sdci/permits/common-projects/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Denver", "CO", {
    overall: "moderate",
    jurisdiction: "City and County of Denver",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Short-term rental license required. Active enforcement on unlicensed listings.",
    sources: [
      {
        label: "Denver — Short-Term Rental License",
        url: "https://www.denvergov.org/Government/Departments/Excise-and-Licenses/Licensing-Information/Short-Term-Rental",
      },
    ],
    confidence: "high",
  }),
  seed("Nashville", "TN", {
    overall: "moderate",
    jurisdiction: "Metropolitan Nashville",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental permit and hotel-motel tax required. Verify zoning district.",
    sources: [
      {
        label: "Nashville — Short Term Rental Properties",
        url: "https://www.nashville.gov/departments/codes/short-term-rental-properties",
      },
    ],
    confidence: "high",
  }),
  seed("Oklahoma City", "OK", {
    overall: "friendly",
    jurisdiction: "City of Oklahoma City",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "Generally permissive. Verify zoning and Oklahoma City business licensing.",
    sources: [
      {
        label: "OKC — Business Licensing",
        url: "https://www.okc.gov/departments/finance/business-registration",
      },
    ],
    confidence: "medium",
  }),
  seed("Portland", "OR", {
    overall: "restrictive",
    jurisdiction: "City of Portland",
    permitRequired: true,
    primaryResidenceOnly: true,
    enforcementLevel: "active",
    summary: "Permit required; whole-home STR limited to primary residence in most cases.",
    sources: [
      {
        label: "Portland — Short-Term Rentals",
        url: "https://www.portland.gov/revenue/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Las Vegas", "NV", {
    overall: "friendly",
    jurisdiction: "City of Las Vegas",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Business license and short-term rental registration required. Non-owner STR allowed.",
    sources: [
      {
        label: "Las Vegas — Short-Term Rental Registration",
        url: "https://www.lasvegasnevada.gov/Business/Short-Term-Rental-Registration",
      },
    ],
    confidence: "high",
  }),
  seed("Memphis", "TN", {
    overall: "moderate",
    jurisdiction: "City of Memphis",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental permit required within city limits.",
    sources: [
      {
        label: "Memphis — Short Term Rental Permit",
        url: "https://www.memphistn.gov/government/housing-and-community-development/short-term-rental-permit/",
      },
    ],
    confidence: "high",
  }),
  seed("Louisville", "KY", {
    overall: "friendly",
    jurisdiction: "Louisville Metro",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "Generally permissive. Occupancy tax and registration requirements apply.",
    sources: [
      {
        label: "Louisville — Occupational License Tax",
        url: "https://louisvilleky.gov/government/revenue/occupational-license-tax",
      },
    ],
    confidence: "medium",
  }),
  seed("Baltimore", "MD", {
    overall: "moderate",
    jurisdiction: "City of Baltimore",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental license required. Non-owner STR allowed with licensing.",
    sources: [
      {
        label: "Baltimore — Short-Term Rentals",
        url: "https://housing.baltimorecity.gov/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Milwaukee", "WI", {
    overall: "moderate",
    jurisdiction: "City of Milwaukee",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Tourist rooming house license required for STR operations.",
    sources: [
      {
        label: "Milwaukee — Tourist Rooming Houses",
        url: "https://city.milwaukee.gov/DCD/BusinessTools/Tourist-Rooming-Houses",
      },
    ],
    confidence: "high",
  }),
  seed("Albuquerque", "NM", {
    overall: "moderate",
    jurisdiction: "City of Albuquerque",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental registration required.",
    sources: [
      {
        label: "Albuquerque — Short-Term Rental Registration",
        url: "https://www.cabq.gov/planning/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Tucson", "AZ", {
    overall: "moderate",
    jurisdiction: "City of Tucson",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental registration required within city limits.",
    sources: [
      {
        label: "Tucson — Short-Term Rental Registration",
        url: "https://www.tucsonaz.gov/Departments/Planning-Development-Services-Department/Short-Term-Rental-Registration",
      },
    ],
    confidence: "high",
  }),
  seed("Raleigh", "NC", {
    overall: "friendly",
    jurisdiction: "City of Raleigh",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "No city-wide ban. Wake County occupancy tax applies. Verify HOA.",
    sources: [
      {
        label: "Wake County — Occupancy Tax",
        url: "https://www.wake.gov/departments-government/tax-administration/local-occupancy-tax",
      },
    ],
    confidence: "medium",
  }),
  seed("Miami", "FL", {
    overall: "moderate",
    jurisdiction: "City of Miami / Miami-Dade County",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Resort tax and county/city registration required. Higher compliance burden than most FL markets.",
    sources: [
      {
        label: "Miami-Dade — Vacation Rentals",
        url: "https://www.miamidade.gov/global/economy/taxes/vacation-rentals.page",
      },
    ],
    confidence: "high",
  }),
  seed("Tampa", "FL", {
    overall: "friendly",
    jurisdiction: "City of Tampa",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "Florida preemption limits bans. Hillsborough County tourist development tax applies.",
    sources: [
      {
        label: "Hillsborough County — Tourist Development Tax",
        url: "https://www.hillsclerk.com/taxes/tourist-development-tax",
      },
    ],
    confidence: "medium",
  }),
  seed("Orlando", "FL", {
    overall: "moderate",
    jurisdiction: "City of Orlando",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Short-term rental registration required. Active enforcement in residential zones.",
    sources: [
      {
        label: "Orlando — Short-Term Rental Registration",
        url: "https://www.orlando.gov/Building-Development/Short-Term-Rental-Registration",
      },
    ],
    confidence: "high",
  }),
  seed("Atlanta", "GA", {
    overall: "moderate",
    jurisdiction: "City of Atlanta",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Short-term rental license required. Non-owner STR allowed with license and taxes.",
    sources: [
      {
        label: "Atlanta — Short-Term Rental License",
        url: "https://www.atlantaga.gov/government/departments/city-planning/zoning/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Minneapolis", "MN", {
    overall: "moderate",
    jurisdiction: "City of Minneapolis",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Short-term rental license required. Non-owner STR allowed with licensing.",
    sources: [
      {
        label: "Minneapolis — Short-Term Rentals",
        url: "https://www.minneapolis.gov/resident-services/property-housing/housing/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Cleveland", "OH", {
    overall: "friendly",
    jurisdiction: "City of Cleveland",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "No dedicated STR ban. Verify zoning and collect applicable taxes.",
    confidence: "low",
  }),
  seed("Kansas City", "MO", {
    overall: "friendly",
    jurisdiction: "City of Kansas City",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "Generally permissive. Business licensing and taxes may apply.",
    sources: [
      {
        label: "KCMO — Business Licensing",
        url: "https://www.kcmo.gov/city-hall/departments/finance/business-licensing",
      },
    ],
    confidence: "medium",
  }),
  seed("Pittsburgh", "PA", {
    overall: "moderate",
    jurisdiction: "City of Pittsburgh",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental license required.",
    sources: [
      {
        label: "Pittsburgh — Short-Term Rental License",
        url: "https://www.pittsburghpa.gov/City-Code/Short-Term-Rental",
      },
    ],
    confidence: "high",
  }),
  seed("Cincinnati", "OH", {
    overall: "friendly",
    jurisdiction: "City of Cincinnati",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "Generally permissive. Verify zoning and tax obligations.",
    confidence: "low",
  }),
  seed("St. Louis", "MO", {
    overall: "friendly",
    jurisdiction: "City of St. Louis",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "No city-wide STR ban. Business registration and taxes may apply.",
    confidence: "low",
  }),
  seed("Sacramento", "CA", {
    overall: "moderate",
    jurisdiction: "City of Sacramento",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental permit required. TOT remittance required.",
    sources: [
      {
        label: "Sacramento — Short-Term Rental Permit",
        url: "https://www.cityofsacramento.gov/community-development/planning/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Salt Lake City", "UT", {
    overall: "moderate",
    jurisdiction: "Salt Lake City",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental license required.",
    sources: [
      {
        label: "SLC — Short-Term Rental License",
        url: "https://www.slc.gov/planning/short-term-rentals/",
      },
    ],
    confidence: "high",
  }),
  seed("San Jose", "CA", {
    overall: "moderate",
    jurisdiction: "City of San Jose",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Short-term rental registration required. Active enforcement.",
    sources: [
      {
        label: "San Jose — Short-Term Rental Registry",
        url: "https://www.sanjoseca.gov/your-government/departments/planning-building-code-enforcement/short-term-rental-registry",
      },
    ],
    confidence: "high",
  }),
  seed("Boise", "ID", {
    overall: "friendly",
    jurisdiction: "City of Boise",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "Generally permissive. Verify Ada County and HOA rules.",
    confidence: "medium",
  }),
  seed("Richmond", "VA", {
    overall: "moderate",
    jurisdiction: "City of Richmond",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental registration required. Virginia statewide registry also applies.",
    sources: [
      {
        label: "Richmond — Short-Term Rentals",
        url: "https://www.rva.gov/planning-development-review/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Birmingham", "AL", {
    overall: "friendly",
    jurisdiction: "City of Birmingham",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "No city-wide STR ban. Verify zoning and Jefferson County rules.",
    confidence: "low",
  }),
  seed("Knoxville", "TN", {
    overall: "moderate",
    jurisdiction: "City of Knoxville",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental permit required within city limits.",
    sources: [
      {
        label: "Knoxville — Short Term Vacation Rentals",
        url: "https://www.knoxvilletn.gov/government/city_departments_offices/city_council/short_term_vacation_rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Savannah", "GA", {
    overall: "restrictive",
    jurisdiction: "City of Savannah",
    permitRequired: true,
    listingCap: 0.2,
    enforcementLevel: "active",
    summary:
      "STVR certificate required within overlay districts only. Non-owner 20% per-ward cap is full — new investor permits on waitlist.",
    sources: [
      {
        label: "Savannah — Short-Term Vacation Rentals",
        url: "https://ga-savannah.civicplus.com/1476/Short-Term-Vacation-Rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Charleston", "SC", {
    overall: "moderate",
    jurisdiction: "City of Charleston",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Short-term rental license required. Strict enforcement in historic districts.",
    sources: [
      {
        label: "Charleston — Short-Term Rentals",
        url: "https://www.charleston-sc.gov/240/Short-Term-Rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Greenville", "SC", {
    overall: "friendly",
    jurisdiction: "City of Greenville",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "Generally permissive. Business license and accommodation tax may apply.",
    confidence: "medium",
  }),
  seed("Asheville", "NC", {
    overall: "moderate",
    jurisdiction: "City of Asheville",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "City STR permit required. Non-owner STR allowed with permit in eligible zones.",
    sources: [
      {
        label: "Asheville — Short-Term Rental Permits",
        url: "https://www.ashevillenc.gov/department/planning/short-term-rentals/",
      },
    ],
    confidence: "high",
  }),
  seed("Huntsville", "AL", {
    overall: "friendly",
    jurisdiction: "City of Huntsville",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "Generally permissive. Verify Madison County zoning.",
    confidence: "low",
  }),
  seed("Chattanooga", "TN", {
    overall: "moderate",
    jurisdiction: "City of Chattanooga",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term vacation rental permit required.",
    sources: [
      {
        label: "Chattanooga — Short Term Vacation Rentals",
        url: "https://chattanooga.gov/planning-and-zoning/short-term-vacation-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Omaha", "NE", {
    overall: "friendly",
    jurisdiction: "City of Omaha",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "No dedicated STR ban. Verify zoning and tax obligations.",
    confidence: "low",
  }),
  seed("Colorado Springs", "CO", {
    overall: "moderate",
    jurisdiction: "City of Colorado Springs",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental license required.",
    sources: [
      {
        label: "Colorado Springs — Short-Term Rental License",
        url: "https://coloradosprings.gov/short-term-rental-license",
      },
    ],
    confidence: "high",
  }),
  seed("Lexington", "KY", {
    overall: "friendly",
    jurisdiction: "Lexington-Fayette Urban County",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "Generally permissive. Verify LFUCG zoning.",
    confidence: "low",
  }),
  seed("Tulsa", "OK", {
    overall: "friendly",
    jurisdiction: "City of Tulsa",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "Generally investor-friendly. Verify zoning and tax obligations.",
    confidence: "low",
  }),
  seed("Spokane", "WA", {
    overall: "moderate",
    jurisdiction: "City of Spokane",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental registration required.",
    sources: [
      {
        label: "Spokane — Short-Term Rentals",
        url: "https://my.spokane.city/planning/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Detroit", "MI", {
    overall: "moderate",
    jurisdiction: "City of Detroit",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental registration required.",
    sources: [
      {
        label: "Detroit — Short-Term Rental Registration",
        url: "https://detroitmi.gov/departments/buildings-safety-engineering-and-environmental/short-term-rental-registration",
      },
    ],
    confidence: "high",
  }),
  seed("Honolulu", "HI", {
    overall: "moderate",
    jurisdiction: "City and County of Honolulu",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "TAT license, GET, and county registration required. Active enforcement.",
    sources: [
      {
        label: "Honolulu — Short-Term Rental",
        url: "https://www.honolulu.gov/dppstr/",
      },
    ],
    confidence: "high",
  }),
  seed("Fayetteville", "AR", {
    overall: "friendly",
    jurisdiction: "City of Fayetteville",
    permitRequired: false,
    enforcementLevel: "low",
    summary: "Arkansas limits local bans. Generally permissive for investor STR.",
    confidence: "medium",
  }),
  seed("Wilmington", "NC", {
    overall: "moderate",
    jurisdiction: "City of Wilmington",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental permit required in city limits.",
    sources: [
      {
        label: "Wilmington — Short-Term Rentals",
        url: "https://www.wilmingtonnc.gov/departments/planning-development/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Fort Myers", "FL", {
    overall: "friendly",
    jurisdiction: "City of Fort Myers",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "Florida preemption limits bans. Lee County tourist tax applies. Verify HOA.",
    sources: [
      {
        label: "Lee County — Tourist Development Tax",
        url: "https://www.leegov.com/tax/tourist-tax",
      },
    ],
    confidence: "medium",
  }),
  seed("Destin", "FL", {
    overall: "moderate",
    jurisdiction: "City of Destin",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental registration required. Okaloosa County rules also apply.",
    sources: [
      {
        label: "Destin — Short-Term Rental Registration",
        url: "https://www.cityofdestin.com/156/Short-Term-Rental-Registration",
      },
    ],
    confidence: "high",
  }),
  seed("Gatlinburg", "TN", {
    overall: "moderate",
    jurisdiction: "City of Gatlinburg",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Gatlinburg STR permit required. Sevier County also regulates vacation rentals.",
    sources: [
      {
        label: "Gatlinburg — Short Term Rental",
        url: "https://www.gatlinburgtn.gov/156/Short-Term-Rental",
      },
    ],
    confidence: "high",
  }),
  seed("Myrtle Beach", "SC", {
    overall: "moderate",
    jurisdiction: "City of Myrtle Beach",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Business license and accommodation tax required. Horry County rules vary by jurisdiction.",
    sources: [
      {
        label: "Myrtle Beach — Short-Term Rentals",
        url: "https://www.cityofmyrtlebeach.com/short-term-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Gulf Shores", "AL", {
    overall: "moderate",
    jurisdiction: "City of Gulf Shores",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental license required. Baldwin County rules apply in unincorporated areas.",
    sources: [
      {
        label: "Gulf Shores — Short-Term Rental License",
        url: "https://www.gulfshoresal.gov/156/Short-Term-Rental-License",
      },
    ],
    confidence: "high",
  }),
  seed("Pigeon Forge", "TN", {
    overall: "moderate",
    jurisdiction: "City of Pigeon Forge",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental permit required. Sevier County vacation rental rules also apply.",
    sources: [
      {
        label: "Pigeon Forge — Short Term Rental",
        url: "https://www.pigeonforge.com/planning/short-term-rentals/",
      },
    ],
    confidence: "medium",
  }),
  seed("Branson", "MO", {
    overall: "friendly",
    jurisdiction: "City of Branson",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Short-term rental registration required. Tourist market with active licensing.",
    sources: [
      {
        label: "Branson — Short-Term Rental Registration",
        url: "https://www.bransonmo.gov/156/Short-Term-Rental-Registration",
      },
    ],
    confidence: "medium",
  }),
  seed("Kissimmee", "FL", {
    overall: "moderate",
    jurisdiction: "City of Kissimmee",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Vacation rental registration required. Osceola County has additional rules for unincorporated areas.",
    sources: [
      {
        label: "Kissimmee — Vacation Rental Registration",
        url: "https://www.kissimmee.gov/156/Vacation-Rental-Registration",
      },
    ],
    confidence: "medium",
  }),
  seed("Panama City Beach", "FL", {
    overall: "moderate",
    jurisdiction: "City of Panama City Beach",
    permitRequired: true,
    enforcementLevel: "active",
    summary: "Short-term rental registration required. Active enforcement in residential zones.",
    sources: [
      {
        label: "Panama City Beach — Short-Term Rentals",
        url: "https://www.pcbfl.gov/156/Short-Term-Rental-Registration",
      },
    ],
    confidence: "high",
  }),
  seed("Sedona", "AZ", {
    overall: "moderate",
    jurisdiction: "City of Sedona",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Vacation rental permit required. Verify residential vs commercial zoning.",
    sources: [
      {
        label: "Sedona — Vacation Rental Permit",
        url: "https://www.sedonaaz.gov/your-government/departments/community-development/vacation-rentals",
      },
    ],
    confidence: "high",
  }),
  seed("Joshua Tree", "CA", {
    overall: "moderate",
    jurisdiction: "San Bernardino County",
    jurisdictionType: "county",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "Unincorporated San Bernardino County TOT registration required. County enforcement increasing.",
    sources: [
      {
        label: "San Bernardino County — Transient Occupancy",
        url: "https://www.sbcounty.gov/landuse/Transient-Occupancy-Tax",
      },
    ],
    confidence: "high",
  }),
  seed("Big Bear Lake", "CA", {
    overall: "moderate",
    jurisdiction: "Big Bear Lake / San Bernardino County",
    permitRequired: true,
    enforcementLevel: "moderate",
    summary: "City TOT and county registration required. Verify mountain zoning.",
    sources: [
      {
        label: "Big Bear Lake — Transient Occupancy Tax",
        url: "https://www.bigbearlake.com/transient-occupancy-tax",
      },
    ],
    confidence: "high",
  }),
  seed("Scottsdale", "AZ", {
    overall: "friendly",
    jurisdiction: "City of Scottsdale",
    permitRequired: false,
    enforcementLevel: "moderate",
    summary: "Generally permissive within Phoenix metro. Transaction privilege tax applies.",
    sources: [
      {
        label: "Scottsdale — Tax & License",
        url: "https://www.scottsdaleaz.gov/finance/tax-license",
      },
    ],
    confidence: "medium",
  }),
];

/** Primary county for each metro (for county-level resolution). */
export const metroCounties = {
  "New York|NY": "New York",
  "Los Angeles|CA": "Los Angeles",
  "Chicago|IL": "Cook",
  "Dallas|TX": "Dallas",
  "Houston|TX": "Harris",
  "Phoenix|AZ": "Maricopa",
  "Philadelphia|PA": "Philadelphia",
  "San Antonio|TX": "Bexar",
  "San Diego|CA": "San Diego",
  "Austin|TX": "Travis",
  "Jacksonville|FL": "Duval",
  "Columbus|OH": "Franklin",
  "Charlotte|NC": "Mecklenburg",
  "Indianapolis|IN": "Marion",
  "San Francisco|CA": "San Francisco",
  "Seattle|WA": "King",
  "Denver|CO": "Denver",
  "Nashville|TN": "Davidson",
  "Oklahoma City|OK": "Oklahoma",
  "Portland|OR": "Multnomah",
  "Las Vegas|NV": "Clark",
  "Memphis|TN": "Shelby",
  "Louisville|KY": "Jefferson",
  "Baltimore|MD": "Baltimore City",
  "Milwaukee|WI": "Milwaukee",
  "Albuquerque|NM": "Bernalillo",
  "Tucson|AZ": "Pima",
  "Raleigh|NC": "Wake",
  "Miami|FL": "Miami-Dade",
  "Tampa|FL": "Hillsborough",
  "Orlando|FL": "Orange",
  "Atlanta|GA": "Fulton",
  "Minneapolis|MN": "Hennepin",
  "Cleveland|OH": "Cuyahoga",
  "Kansas City|MO": "Jackson",
  "Pittsburgh|PA": "Allegheny",
  "Cincinnati|OH": "Hamilton",
  "St. Louis|MO": "St. Louis City",
  "Sacramento|CA": "Sacramento",
  "Salt Lake City|UT": "Salt Lake",
  "San Jose|CA": "Santa Clara",
  "Boise|ID": "Ada",
  "Richmond|VA": "Richmond City",
  "Birmingham|AL": "Jefferson",
  "Knoxville|TN": "Knox",
  "Savannah|GA": "Chatham",
  "Charleston|SC": "Charleston",
  "Greenville|SC": "Greenville",
  "Asheville|NC": "Buncombe",
  "Huntsville|AL": "Madison",
  "Chattanooga|TN": "Hamilton",
  "Omaha|NE": "Douglas",
  "Colorado Springs|CO": "El Paso",
  "Lexington|KY": "Fayette",
  "Tulsa|OK": "Tulsa",
  "Spokane|WA": "Spokane",
  "Detroit|MI": "Wayne",
  "Honolulu|HI": "Honolulu",
  "Fayetteville|AR": "Washington",
  "Wilmington|NC": "New Hanover",
  "Fort Myers|FL": "Lee",
  "Destin|FL": "Okaloosa",
  "Gatlinburg|TN": "Sevier",
  "Myrtle Beach|SC": "Horry",
  "Gulf Shores|AL": "Baldwin",
  "Pigeon Forge|TN": "Sevier",
  "Branson|MO": "Taney",
  "Kissimmee|FL": "Osceola",
  "Panama City Beach|FL": "Bay",
  "Sedona|AZ": "Yavapai",
  "Joshua Tree|CA": "San Bernardino",
  "Big Bear Lake|CA": "San Bernardino",
  "Scottsdale|AZ": "Maricopa",
};

/** County-level overrides (used when city has no override or for unincorporated areas). */
export const countySeeds = [
  {
    county: "San Bernardino",
    stateAbbr: "CA",
    overall: "moderate",
    jurisdiction: "San Bernardino County",
    jurisdictionType: "county",
    signals: {
      operatingAllowed: true,
      permitRequired: true,
      primaryResidenceOnly: false,
      nightCap: null,
      listingCap: null,
      enforcementLevel: "moderate",
    },
    summary:
      "Unincorporated county areas require transient occupancy registration. City-specific rules apply within incorporated cities.",
    sources: [
      {
        label: "San Bernardino County — Transient Occupancy",
        url: "https://www.sbcounty.gov/landuse/Transient-Occupancy-Tax",
      },
    ],
    confidence: "high",
    verifiedAt: "2026-06-01",
  },
  {
    county: "Sevier",
    stateAbbr: "TN",
    overall: "moderate",
    jurisdiction: "Sevier County",
    jurisdictionType: "county",
    signals: {
      operatingAllowed: true,
      permitRequired: true,
      primaryResidenceOnly: false,
      nightCap: null,
      listingCap: null,
      enforcementLevel: "moderate",
    },
    summary:
      "County vacation rental regulations apply in unincorporated areas. Gatlinburg and Pigeon Forge have separate city permits.",
    sources: [
      {
        label: "Sevier County — Planning",
        url: "https://www.seviercountytn.org/planning",
      },
    ],
    confidence: "medium",
    verifiedAt: "2026-06-01",
  },
  {
    county: "Chatham",
    stateAbbr: "GA",
    overall: "moderate",
    jurisdiction: "Chatham County (unincorporated)",
    jurisdictionType: "county",
    signals: {
      operatingAllowed: true,
      permitRequired: true,
      primaryResidenceOnly: false,
      nightCap: null,
      listingCap: null,
      enforcementLevel: "moderate",
    },
    summary:
      "Unincorporated Chatham County has simpler STR rules than City of Savannah. Savannah city STVR overlay rules do not apply county-wide.",
    sources: [
      {
        label: "Chatham County — Planning",
        url: "https://www.chathamcountyga.gov/Departments/Planning",
      },
    ],
    confidence: "medium",
    verifiedAt: "2026-06-01",
  },
  {
    county: "Miami-Dade",
    stateAbbr: "FL",
    overall: "moderate",
    jurisdiction: "Miami-Dade County",
    jurisdictionType: "county",
    signals: {
      operatingAllowed: true,
      permitRequired: true,
      primaryResidenceOnly: false,
      nightCap: null,
      listingCap: null,
      enforcementLevel: "moderate",
    },
    summary: "County vacation rental registration and resort tax required across municipalities.",
    sources: [
      {
        label: "Miami-Dade — Vacation Rentals",
        url: "https://www.miamidade.gov/global/economy/taxes/vacation-rentals.page",
      },
    ],
    confidence: "high",
    verifiedAt: "2026-06-01",
  },
  {
    county: "Osceola",
    stateAbbr: "FL",
    overall: "moderate",
    jurisdiction: "Osceola County",
    jurisdictionType: "county",
    signals: {
      operatingAllowed: true,
      permitRequired: true,
      primaryResidenceOnly: false,
      nightCap: null,
      listingCap: null,
      enforcementLevel: "moderate",
    },
    summary: "County vacation rental certificate required in unincorporated areas. Kissimmee has separate city registration.",
    sources: [
      {
        label: "Osceola County — Vacation Rentals",
        url: "https://www.osceola.org/agencies-departments/county-administration/community-development/vacation-rentals",
      },
    ],
    confidence: "high",
    verifiedAt: "2026-06-01",
  },
  {
    county: "Horry",
    stateAbbr: "SC",
    overall: "moderate",
    jurisdiction: "Horry County",
    jurisdictionType: "county",
    signals: {
      operatingAllowed: true,
      permitRequired: true,
      primaryResidenceOnly: false,
      nightCap: null,
      listingCap: null,
      enforcementLevel: "moderate",
    },
    summary: "County accommodation tax and licensing. City of Myrtle Beach has additional requirements.",
    sources: [
      {
        label: "Horry County — Accommodations Tax",
        url: "https://www.horrycounty.org/Departments/Finance/Accommodations-Tax",
      },
    ],
    confidence: "medium",
    verifiedAt: "2026-06-01",
  },
];

/** CBSA-level defaults when city/county missing (rare fallback). */
export const cbsaSeeds = [
  {
    cbsaCode: "42940",
    overall: "moderate",
    jurisdiction: "Sevierville TN CBSA (Sevier County)",
    jurisdictionType: "cbsa",
    signals: {
      operatingAllowed: true,
      permitRequired: true,
      primaryResidenceOnly: false,
      nightCap: null,
      listingCap: null,
      enforcementLevel: "moderate",
    },
    summary: "Smoky Mountain STR market — city and county permits common. Gatlinburg/Pigeon Forge/Sevierville each have rules.",
    sources: [
      {
        label: "Sevier County — Planning",
        url: "https://www.seviercountytn.org/planning",
      },
    ],
    confidence: "medium",
    verifiedAt: "2026-06-01",
  },
];
