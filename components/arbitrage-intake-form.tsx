"use client";

// Guided intake workflow — MandiMargin's second required feature (a
// structured multi-step flow + new UI elements, per AGENTS.md / the
// assignment brief's own examples). Instead of leaving the merchant to type
// a free-text message, this collects the three inputs the arbitrage tool
// needs (origin district, quantity, freight rate) through a short form and
// sends one well-formed message, so the model can call arbitrageCalculator
// immediately without a back-and-forth clarification round.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DISTRICTS } from "@/lib/districts";
import { Calculator } from "lucide-react";

export function ArbitrageIntakeForm({
  onSubmit,
}: {
  onSubmit: (message: string) => void;
}) {
  const [district, setDistrict] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"kg" | "quintal">("quintal");
  const [freight, setFreight] = useState("");

  const districtName = DISTRICTS.find((d) => d.id === district)?.name;
  const canSubmit = !!district && !!quantity && !!freight;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !districtName) return;
    const qtyLabel = unit === "quintal" ? `${quantity} quintals` : `${quantity} kg`;
    onSubmit(
      `I'm in ${districtName}. I have ${qtyLabel} of paddy/rice to sell, and my transport cost is ₹${freight} per km. Where should I sell for the best net profit?`
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-xl border bg-card/50 p-3 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Calculator className="size-4" />
        Quick check: where should I sell today?
      </div>
      <FieldGroup className="grid grid-cols-1 sm:grid-cols-[1.3fr_1fr_1fr] gap-2.5">
        <Field>
          <FieldLabel className="text-xs">Your district</FieldLabel>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {DISTRICTS.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel className="text-xs">Quantity</FieldLabel>
          <div className="flex gap-1.5">
            <Input
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="e.g. 100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="min-w-0"
            />
            <Select value={unit} onValueChange={(v) => setUnit(v as "kg" | "quintal")}>
              <SelectTrigger className="w-24 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quintal">quintal</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Field>

        <Field>
          <FieldLabel className="text-xs">Freight (₹/km)</FieldLabel>
          <Input
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="e.g. 45"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
          />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={!canSubmit} size="sm" className="self-start">
        Find the best district
      </Button>
    </form>
  );
}
