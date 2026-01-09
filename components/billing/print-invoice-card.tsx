"use client";

import { Droplets, Zap } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface PrintInvoiceCardProps {
  invoice: Invoice;
  className?: string;
}

export function PrintInvoiceCard({
  invoice,
  className,
}: PrintInvoiceCardProps) {
  const roomLabel =
    invoice.room?.roomNumber || invoice.roomNumber || invoice.roomId || "—";
  const waterReading = invoice.readings?.find(
    (reading) => reading.meterType === "water",
  );
  const electricReading = invoice.readings?.find(
    (reading) => reading.meterType === "electric",
  );
  const roomRent = invoice.room?.monthlyRent ?? null;
  const waterSubtotal = invoice.waterSubtotal ?? invoice.waterAmount ?? 0;
  const electricSubtotal =
    invoice.electricSubtotal ?? invoice.electricAmount ?? 0;
  const isWaterFixed = invoice.waterBillingMode === "fixed";

  return (
    <div className={className}>
      <div className="space-y-3 rounded-lg border border-border bg-white p-4 text-xs text-slate-900 shadow-sm">
        <div className="text-center">
          <p className="text-lg font-semibold">Invoice</p>
          <p className="text-sm text-slate-600">Room {roomLabel}</p>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Item</th>
                <th className="px-3 py-2 text-center font-medium">Prev</th>
                <th className="px-3 py-2 text-center font-medium">Curr</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium">Room Rent</td>
                <td className="px-3 py-2 text-center text-slate-400">—</td>
                <td className="px-3 py-2 text-center text-slate-400">—</td>
                <td className="px-3 py-2 text-right font-mono">
                  {roomRent ? formatCurrency(roomRent) : "—"}
                </td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-blue-500" />
                    Water {isWaterFixed ? "(Fixed)" : ""}
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-slate-500">
                  {isWaterFixed ? "—" : (waterReading?.previousReading ?? "—")}
                </td>
                <td className="px-3 py-2 text-center text-slate-500">
                  {isWaterFixed ? "—" : (waterReading?.currentReading ?? "—")}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatCurrency(waterSubtotal)}
                </td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Electric
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-slate-500">
                  {electricReading?.previousReading ?? "—"}
                </td>
                <td className="px-3 py-2 text-center text-slate-500">
                  {electricReading?.currentReading ?? "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatCurrency(electricSubtotal)}
                </td>
              </tr>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="px-3 py-2 font-semibold">Total</td>
                <td className="px-3 py-2 text-center text-slate-400">—</td>
                <td className="px-3 py-2 text-center text-slate-400">—</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {formatCurrency(invoice.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-1 text-[11px] text-slate-600">
          <div className="flex items-center justify-between">
            <span>Due date</span>
            <span className="font-medium text-slate-900">
              {new Date(invoice.dueDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Invoice</span>
            <span className="font-mono text-slate-700">{invoice.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
