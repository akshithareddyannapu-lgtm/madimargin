// lib/districts.ts
//
// Static reference data for the arbitrage tool's MVP scope: the rice-growing
// districts of Andhra Pradesh and Telangana. This deliberately replaces a
// paid maps API (Google Maps / Mapbox) with a small, free, always-available
// lookup table + the Haversine formula — important for a public, no-login
// assistant that must keep working for strangers without a metered API key.
//
// Coordinates are approximate district-headquarters centroids, good enough
// to rank neighboring districts by relative distance for a decision-support
// tool — not survey-grade. Adjacency is a simplified "which districts
// commonly border/trade with this one" list, not an exhaustive GIS boundary
// computation. Both simplifications are documented as deliberate scope
// decisions in DOCUMENTATION.md.

export interface DistrictInfo {
  id: string; // slug, used as the canonical key
  name: string; // display name
  state: "Andhra Pradesh" | "Telangana";
  lat: number;
  lon: number;
  neighbors: string[]; // ids of neighboring districts considered for arbitrage
  // Reference (fallback) paddy price in INR per quintal (100 kg), common
  // variety. Used ONLY when a live price cannot be fetched/parsed. Sourced
  // as a rough approximation around India's common-paddy MSP band — replace
  // with real Agmarknet averages before relying on this for real decisions.
  fallbackPricePerQuintal: number;
}

export const DISTRICTS: DistrictInfo[] = [
  {
    id: "east-godavari",
    name: "East Godavari (Kakinada/Rajahmundry)",
    state: "Andhra Pradesh",
    lat: 17.0005,
    lon: 81.804,
    neighbors: ["west-godavari", "khammam"],
    fallbackPricePerQuintal: 2260,
  },
  {
    id: "west-godavari",
    name: "West Godavari (Eluru)",
    state: "Andhra Pradesh",
    lat: 16.7107,
    lon: 81.0955,
    neighbors: ["east-godavari", "krishna", "khammam"],
    fallbackPricePerQuintal: 2240,
  },
  {
    id: "krishna",
    name: "Krishna (Machilipatnam)",
    state: "Andhra Pradesh",
    lat: 16.1875,
    lon: 81.1389,
    neighbors: ["west-godavari", "ntr-vijayawada", "guntur", "suryapet"],
    fallbackPricePerQuintal: 2250,
  },
  {
    id: "ntr-vijayawada",
    name: "NTR (Vijayawada)",
    state: "Andhra Pradesh",
    lat: 16.5062,
    lon: 80.648,
    neighbors: ["krishna", "guntur", "nalgonda"],
    fallbackPricePerQuintal: 2270,
  },
  {
    id: "guntur",
    name: "Guntur",
    state: "Andhra Pradesh",
    lat: 16.3067,
    lon: 80.4365,
    neighbors: ["ntr-vijayawada", "krishna", "prakasam", "nalgonda"],
    fallbackPricePerQuintal: 2280,
  },
  {
    id: "prakasam",
    name: "Prakasam (Ongole)",
    state: "Andhra Pradesh",
    lat: 15.5057,
    lon: 80.0499,
    neighbors: ["guntur", "nellore", "kadapa"],
    fallbackPricePerQuintal: 2230,
  },
  {
    id: "nellore",
    name: "SPSR Nellore",
    state: "Andhra Pradesh",
    lat: 14.4426,
    lon: 79.9865,
    neighbors: ["prakasam", "kadapa"],
    fallbackPricePerQuintal: 2220,
  },
  {
    id: "kadapa",
    name: "YSR Kadapa",
    state: "Andhra Pradesh",
    lat: 14.4673,
    lon: 78.8242,
    neighbors: ["prakasam", "nellore"],
    fallbackPricePerQuintal: 2200,
  },
  {
    id: "nizamabad",
    name: "Nizamabad",
    state: "Telangana",
    lat: 18.6725,
    lon: 78.0941,
    neighbors: ["kamareddy", "karimnagar", "medak"],
    fallbackPricePerQuintal: 2210,
  },
  {
    id: "kamareddy",
    name: "Kamareddy",
    state: "Telangana",
    lat: 18.32,
    lon: 78.34,
    neighbors: ["nizamabad", "medak"],
    fallbackPricePerQuintal: 2190,
  },
  {
    id: "medak",
    name: "Medak",
    state: "Telangana",
    lat: 18.045,
    lon: 78.27,
    neighbors: ["kamareddy", "nizamabad", "karimnagar"],
    fallbackPricePerQuintal: 2195,
  },
  {
    id: "karimnagar",
    name: "Karimnagar",
    state: "Telangana",
    lat: 18.4386,
    lon: 79.1288,
    neighbors: ["nizamabad", "medak", "warangal"],
    fallbackPricePerQuintal: 2225,
  },
  {
    id: "warangal",
    name: "Warangal",
    state: "Telangana",
    lat: 17.9689,
    lon: 79.5941,
    neighbors: ["karimnagar", "khammam", "nalgonda", "suryapet"],
    fallbackPricePerQuintal: 2235,
  },
  {
    id: "khammam",
    name: "Khammam",
    state: "Telangana",
    lat: 17.2473,
    lon: 80.1514,
    neighbors: ["warangal", "east-godavari", "west-godavari", "suryapet"],
    fallbackPricePerQuintal: 2265,
  },
  {
    id: "nalgonda",
    name: "Nalgonda",
    state: "Telangana",
    lat: 17.0575,
    lon: 79.269,
    neighbors: ["suryapet", "warangal", "guntur", "ntr-vijayawada"],
    fallbackPricePerQuintal: 2215,
  },
  {
    id: "suryapet",
    name: "Suryapet",
    state: "Telangana",
    lat: 17.14,
    lon: 79.62,
    neighbors: ["nalgonda", "khammam", "warangal", "krishna"],
    fallbackPricePerQuintal: 2245,
  },
];

const BY_ID = new Map(DISTRICTS.map((d) => [d.id, d]));
// Lowercased name (and common short forms) -> id, for resolving free-text user input.
const NAME_INDEX = new Map<string, string>();
for (const d of DISTRICTS) {
  NAME_INDEX.set(d.id.replace(/-/g, " "), d.id);
  NAME_INDEX.set(d.name.toLowerCase(), d.id);
  // Also index the part before a parenthetical, e.g. "east godavari"
  const base = d.name.split("(")[0].trim().toLowerCase();
  NAME_INDEX.set(base, d.id);
}
// A few common aliases / alternate spellings.
const ALIASES: Record<string, string> = {
  vijayawada: "ntr-vijayawada",
  ntr: "ntr-vijayawada",
  kakinada: "east-godavari",
  rajahmundry: "east-godavari",
  eluru: "west-godavari",
  machilipatnam: "krishna",
  ongole: "prakasam",
  kadapa: "kadapa",
  cuddapah: "kadapa",
};
for (const [alias, id] of Object.entries(ALIASES)) NAME_INDEX.set(alias, id);

/** Resolve free-text district/city input (case-insensitive) to a DistrictInfo, or undefined. */
export function findDistrict(input: string): DistrictInfo | undefined {
  const key = input.trim().toLowerCase();
  const resolvedId = BY_ID.has(key) ? key : NAME_INDEX.get(key);
  return resolvedId ? BY_ID.get(resolvedId) : undefined;
}

export function districtById(id: string): DistrictInfo | undefined {
  return BY_ID.get(id);
}

export function neighborsOf(d: DistrictInfo): DistrictInfo[] {
  return d.neighbors.map((id) => BY_ID.get(id)).filter((x): x is DistrictInfo => !!x);
}

/** Straight-line distance in km between two lat/lon points (Haversine formula). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius, km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Straight-line distance underestimates real road distance (roads aren't
// straight lines). This fixed fudge factor approximates typical Indian
// district-road routing without needing a paid directions API. Documented
// as a known simplification in DOCUMENTATION.md.
export const ROAD_DISTANCE_FACTOR = 1.35;

/** Road-distance estimate in km between two districts. */
export function roadDistanceKm(a: DistrictInfo, b: DistrictInfo): number {
  if (a.id === b.id) return 0;
  return haversineKm(a.lat, a.lon, b.lat, b.lon) * ROAD_DISTANCE_FACTOR;
}

/** All district display names, for prompt guidance / error messages. */
export const DISTRICT_NAMES = DISTRICTS.map((d) => d.name);
