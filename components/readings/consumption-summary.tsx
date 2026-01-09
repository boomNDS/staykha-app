import * as React from "react";

interface ConsumptionSummaryProps {
  water?: number | null;
  electric?: number | null;
}

export function ConsumptionSummary({
  water,
  electric,
}: ConsumptionSummaryProps) {
  const showWater = typeof water === "number";
  const showElectric = typeof electric === "number";
  if (!showWater && !showElectric) {
    return null;
  }

  return (
    <div
      className={`grid gap-4 ${showWater && showElectric ? "sm:grid-cols-2" : ""}`}
    >
      {showWater ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Water Consumption
            </span>
            <span className="text-2xl font-bold text-primary sm:text-3xl">
              {water.toLocaleString()} m³
            </span>
          </div>
        </div>
      ) : null}
      {showElectric ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Electric Consumption
            </span>
            <span className="text-2xl font-bold text-primary sm:text-3xl">
              {electric.toLocaleString()} kWh
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
