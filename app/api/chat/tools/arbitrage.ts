// app/api/chat/tools/arbitrage.ts
//
// MandiMargin's core feature: given an origin district, a paddy/rice
// quantity, and a per-km freight rate, rank the origin plus its neighboring
// districts by NET profit after freight and recommend the best one.
//
//   netProfit = pricePerKg * quantityKg - freightPerKm * distanceKm
//
// (the same formula the team's original brief specified, restated per-kg).
//
// Price sourcing: tries a live Exa fetch against Agmarknet / state mandi
// board pages for each district and heuristically extracts a rupees-per-
// quintal figure from the page text. If no plausible number is found (page
// blocked, paywalled, layout changed, network error, etc.) it falls back to
// a small pre-seeded reference dataset (lib/districts.ts) so the tool NEVER
// fails or fabricates a number — it just labels the figure "reference" and
// says so, which the system prompt requires the model to surface to the user.
import { tool } from "ai";
import { z } from "zod";
import { getExa, domainOf } from "./web-search";
import {
  DISTRICTS,
  DISTRICT_NAMES,
  findDistrict,
  neighborsOf,
  roadDistanceKm,
  type DistrictInfo,
} from "@/lib/districts";
import { EXA_MAX_CHARACTERS } from "@/config";
import type { UISource } from "@/types/data";

// Sanity band for extracted prices (INR per quintal of paddy/rice). Anything
// outside this band is almost certainly a mis-parse (a date, a phone number,
// an unrelated rupee figure on the page) — reject it and fall back instead
// of showing the user a nonsense number.
const PLAUSIBLE_MIN_PRICE = 1200;
const PLAUSIBLE_MAX_PRICE = 5500;

export interface PriceQuote {
  pricePerQuintal: number;
  live: boolean; // true = parsed from a live fetch; false = reference/fallback dataset
  sourceTitle: string;
  sourceUrl: string;
  asOf: string; // ISO date string
}

export interface ArbitrageOption {
  districtId: string;
  districtName: string;
  isOrigin: boolean;
  distanceKm: number;
  price: PriceQuote;
  freightCost: number;
  grossRevenue: number;
  netProfit: number;
}

export interface ArbitrageResult {
  originDistrict: string;
  quantityKg: number;
  freightPerKm: number;
  generatedAt: string;
  options: ArbitrageOption[];
  recommendedDistrictId: string;
  upliftVsOrigin: number;
}

function extractPricePerQuintal(text: string): number | null {
  if (!text) return null;
  // Look for "<number> per quintal / per qtl / /quintal" style mentions,
  // optionally preceded by ₹ or Rs. Numbers may contain commas.
  const patterns = [
    /(?:₹|rs\.?|inr)\s?([\d,]{3,7})\s*(?:\/|per)\s*(?:quintal|qtl|q\.)/gi,
    /([\d,]{3,7})\s*(?:\/|per)\s*(?:quintal|qtl|q\.)/gi,
  ];
  for (const re of patterns) {
    const matches = [...text.matchAll(re)];
    for (const m of matches) {
      const n = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n >= PLAUSIBLE_MIN_PRICE && n <= PLAUSIBLE_MAX_PRICE) {
        return n;
      }
    }
  }
  return null;
}

async function fetchLivePrice(district: DistrictInfo): Promise<PriceQuote> {
  const fallback: PriceQuote = {
    pricePerQuintal: district.fallbackPricePerQuintal,
    live: false,
    sourceTitle: "Reference price (not live — sample dataset)",
    sourceUrl: "",
    asOf: new Date().toISOString().slice(0, 10),
  };
  try {
    const exa = getExa();
    const response = (await exa.search(
      `${district.name} district paddy rice mandi price today per quintal Agmarknet`,
      {
        type: "auto",
        numResults: 3,
        livecrawl: "preferred",
        contents: { text: { maxCharacters: EXA_MAX_CHARACTERS } },
      } as any
    )) as any;
    const results: any[] = response?.results || [];
    for (const r of results) {
      if (!r.url) continue;
      const text: string = r.text || "";
      const price = extractPricePerQuintal(text);
      if (price) {
        return {
          pricePerQuintal: price,
          live: true,
          sourceTitle: r.title || domainOf(r.url),
          sourceUrl: r.url,
          asOf: (r.publishedDate || new Date().toISOString()).slice(0, 10),
        };
      }
    }
    return fallback;
  } catch (error) {
    console.error(`arbitrage: price fetch failed for ${district.name}:`, error);
    return fallback;
  }
}

export function createArbitrageCalculator(collect: (s: UISource, content?: string) => void) {
  return tool({
    description:
      "Calculate net profit for selling paddy/rice at the origin district vs. neighboring districts in Andhra Pradesh or Telangana, after netting out freight cost, and recommend the destination with the highest net profit. " +
      "Call this whenever the user gives (or you can confirm) an origin district, a quantity of rice/paddy, and a transport/freight cost per km. " +
      "If any of the three inputs is missing or ambiguous, ASK the user for it instead of guessing — never invent a quantity or freight rate. " +
      `Supported districts (Andhra Pradesh & Telangana rice belt only): ${DISTRICT_NAMES.join(", ")}. ` +
      "If the user's location is outside this list or outside AP/Telangana, say this tool only covers the AP/Telangana rice belt for now and do not call the tool.",
    inputSchema: z.object({
      originDistrict: z
        .string()
        .describe(
          "The merchant's current district (e.g. 'Guntur', 'Nizamabad'). Must be one of the supported AP/Telangana districts."
        ),
      quantityKg: z
        .number()
        .positive()
        .describe("Quantity of paddy/rice the merchant has to sell, in kilograms."),
      freightPerKm: z
        .number()
        .nonnegative()
        .describe(
          "Transport cost in INR per kilometer for the shipment (the truck/trip rate, not per kg)."
        ),
    }),
    execute: async ({ originDistrict, quantityKg, freightPerKm }) => {
      const origin = findDistrict(originDistrict);
      if (!origin) {
        return {
          error: `"${originDistrict}" is not a recognized district in this tool's AP/Telangana coverage. Supported districts: ${DISTRICT_NAMES.join(", ")}.`,
        };
      }

      const candidates = [origin, ...neighborsOf(origin)];
      const options: ArbitrageOption[] = await Promise.all(
        candidates.map(async (d) => {
          const distanceKm = roadDistanceKm(origin, d);
          const price = await fetchLivePrice(d);
          if (price.live && price.sourceUrl) {
            collect(
              {
                kind: "web",
                title: price.sourceTitle,
                url: price.sourceUrl,
                site: domainOf(price.sourceUrl),
                publishedDate: price.asOf,
              },
              `${d.name} paddy price: ~₹${price.pricePerQuintal}/quintal (as of ${price.asOf})`
            );
          }
          const pricePerKg = price.pricePerQuintal / 100;
          const grossRevenue = pricePerKg * quantityKg;
          const freightCost = freightPerKm * distanceKm;
          const netProfit = grossRevenue - freightCost;
          return {
            districtId: d.id,
            districtName: d.name,
            isOrigin: d.id === origin.id,
            distanceKm: Math.round(distanceKm * 10) / 10,
            price,
            freightCost: Math.round(freightCost),
            grossRevenue: Math.round(grossRevenue),
            netProfit: Math.round(netProfit),
          };
        })
      );

      options.sort((a, b) => b.netProfit - a.netProfit);
      const best = options[0];
      const originOption = options.find((o) => o.isOrigin)!;

      const result: ArbitrageResult = {
        originDistrict: origin.name,
        quantityKg,
        freightPerKm,
        generatedAt: new Date().toISOString(),
        options,
        recommendedDistrictId: best.districtId,
        upliftVsOrigin: best.netProfit - originOption.netProfit,
      };
      return result;
    },
  });
}
