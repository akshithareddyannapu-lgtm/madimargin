"use client";

// Result-card / comparison-table UI for the arbitrageCalculator tool.
// Renders the tool's structured JSON output deterministically — independent
// of the model's prose — the same pattern the template already uses for the
// Sources box (see types/data.ts, components/messages/sources.tsx). This is
// the feature's "new UI element" half; the tool itself is the "new tool"
// half (see AGENTS.md's two required feature types).

import { TrendingUp, Truck, MapPin } from "lucide-react";
import type { ArbitrageOption, ArbitrageResult } from "@/app/api/chat/tools/arbitrage";

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function OptionRow({ option, isBest }: { option: ArbitrageOption; isBest: boolean }) {
  return (
    <div
      className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_repeat(4,1fr)] gap-x-4 gap-y-1 items-center rounded-lg border px-3 py-2.5 text-sm ${
        isBest
          ? "border-green-600/50 bg-green-600/10"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-1.5 font-medium min-w-0">
        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{option.districtName}</span>
        {option.isOrigin && (
          <span className="text-[10px] text-muted-foreground border rounded px-1 shrink-0">origin</span>
        )}
        {isBest && (
          <span className="text-[10px] text-green-700 dark:text-green-400 font-semibold shrink-0">
            BEST
          </span>
        )}
      </div>
      <div className="hidden sm:block text-muted-foreground">
        {option.distanceKm === 0 ? "local" : `${option.distanceKm} km`}
      </div>
      <div className="hidden sm:block text-muted-foreground">
        {formatINR(option.price.pricePerQuintal)}/qtl
        <span className="ml-1 text-[10px]">{option.price.live ? "live" : "ref."}</span>
      </div>
      <div className="hidden sm:block text-muted-foreground">
        −{formatINR(option.freightCost)} freight
      </div>
      <div
        className={`text-right font-semibold ${isBest ? "text-green-700 dark:text-green-400" : ""}`}
      >
        {formatINR(option.netProfit)}
      </div>
      {/* Mobile-only compact detail line */}
      <div className="col-span-2 sm:hidden text-xs text-muted-foreground">
        {(option.distanceKm === 0 ? "local" : `${option.distanceKm} km`)} · {formatINR(option.price.pricePerQuintal)}/qtl ({option.price.live ? "live" : "ref."}) · −{formatINR(option.freightCost)} freight
      </div>
    </div>
  );
}

export function ArbitrageCard({ data }: { data: ArbitrageResult | { error: string } }) {
  if ("error" in data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
        {data.error}
      </div>
    );
  }

  const best = data.options.find((o) => o.districtId === data.recommendedDistrictId);
  const anyLive = data.options.some((o) => o.price.live);

  return (
    <div className="w-full rounded-xl border bg-card/50 p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <TrendingUp className="size-4 text-green-600" />
        <span>
          Best option: <span className="text-green-700 dark:text-green-400">{best?.districtName}</span>
        </span>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Truck className="size-3.5" />
          {formatINR(data.freightPerKm)}/km
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {data.options.map((option) => (
          <OptionRow key={option.districtId} option={option} isBest={option.districtId === data.recommendedDistrictId} />
        ))}
      </div>

      <div className="text-[11px] text-muted-foreground pt-1 border-t">
        {anyLive
          ? "Prices marked \"live\" were fetched just now; \"ref.\" prices are reference figures — confirm at the mandi before shipping."
          : "Live prices could not be fetched — all figures below are reference data. Confirm at the mandi before shipping."}
      </div>
    </div>
  );
}
