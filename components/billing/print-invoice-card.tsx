"use client";

import { Droplets, Zap } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/lib/hooks/use-settings";

interface PrintInvoiceCardProps {
  invoice: Invoice;
  className?: string;
}

export function PrintInvoiceCard({
  invoice,
  className,
}: PrintInvoiceCardProps) {
  const { settings } = useSettings();
  
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

  // Thai labels with fallbacks
  const labelInvoice = settings?.labelInvoice || "ใบแจ้งหนี้";
  const labelRoomRent = settings?.labelRoomRent || "ค่าเช่าห้อง";
  const labelWater = settings?.labelWater || "ค่าน้ำประปา";
  const labelElectricity = settings?.labelElectricity || "ค่าไฟฟ้า";
  const labelTotal = "จำนวนเงินรวม";

  // Payment details
  const bankName = settings?.bankName || "";
  const bankAccountNumber = settings?.bankAccountNumber || "";
  const lineId = settings?.lineId || "";
  const latePaymentPenalty = settings?.latePaymentPenaltyPerDay || 0;
  const dueDateDay = settings?.dueDateDayOfMonth || 5;

  // Format due date message
  const dueDateMessage = `ภายในวันที่ ${dueDateDay} ของทุกเดือน`;
  const penaltyMessage = latePaymentPenalty > 0 
    ? `หากเกินกำหนด ชำระค่าปรับวันละ ${formatCurrency(latePaymentPenalty, settings?.currency || "THB")}`
    : "";

  return (
    <div className={className}>
      <div className="space-y-4 rounded-lg border border-border bg-white p-6 text-sm text-slate-900 shadow-sm print:p-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-2xl font-bold">{labelInvoice}</p>
          <p className="mt-2 text-lg font-semibold">ห้องเลขที่ {roomLabel}</p>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(invoice.issueDate || invoice.createdAt || new Date()).toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Billing Table */}
        <div className="overflow-hidden rounded-md border-2 border-slate-300">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">รายการ</th>
                <th className="px-4 py-3 text-center font-semibold">เลขมิเตอร์ก่อน</th>
                <th className="px-4 py-3 text-center font-semibold">เลขมิเตอร์หลัง</th>
                <th className="px-4 py-3 text-right font-semibold">จำนวนเงินรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Room Rent */}
              {roomRent && roomRent > 0 && (
                <tr>
                  <td className="px-4 py-3 font-medium">{labelRoomRent}</td>
                  <td className="px-4 py-3 text-center text-slate-400">—</td>
                  <td className="px-4 py-3 text-center text-slate-400">—</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {formatCurrency(roomRent, settings?.currency || "THB")}
                  </td>
                </tr>
              )}
              
              {/* Water */}
              <tr>
                <td className="px-4 py-3 font-medium">
                  {labelWater} {isWaterFixed ? "(ค่าบริการ)" : ""}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {isWaterFixed ? "—" : (waterReading?.previousReading ?? "—")}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {isWaterFixed ? "—" : (waterReading?.currentReading ?? "—")}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold">
                  {formatCurrency(waterSubtotal, settings?.currency || "THB")}
                </td>
              </tr>
              
              {/* Electricity */}
              <tr>
                <td className="px-4 py-3 font-medium">{labelElectricity}</td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {electricReading?.previousReading ?? "—"}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {electricReading?.currentReading ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold">
                  {formatCurrency(electricSubtotal, settings?.currency || "THB")}
                </td>
              </tr>
              
              {/* Total */}
              <tr className="bg-slate-50">
                <td className="px-4 py-3 font-bold text-lg">{labelTotal}</td>
                <td className="px-4 py-3 text-center text-slate-400">—</td>
                <td className="px-4 py-3 text-center text-slate-400">—</td>
                <td className="px-4 py-3 text-right font-mono text-lg font-bold">
                  {formatCurrency(invoice.total, settings?.currency || "THB")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Instructions */}
        <div className="space-y-3 border-t-2 border-slate-300 pt-4">
          <div className="space-y-2">
            <p className="font-semibold text-slate-900">
              วันสุดท้ายที่ต้องชำระ : {dueDateMessage}
            </p>
            {penaltyMessage && (
              <p className="font-semibold text-red-600">
                {penaltyMessage}
              </p>
            )}
          </div>
          
          {bankName && bankAccountNumber && (
            <div className="space-y-1">
              <p className="font-medium text-slate-700">
                ชำระเงินได้ที่ {bankName} เลขบัญชี {bankAccountNumber}
              </p>
              {lineId && (
                <p className="text-slate-600">
                  (ไอดีไลน์ {lineId})
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>วันที่ออกบิล</span>
            <span className="font-medium text-slate-700">
              {new Date(invoice.issueDate || invoice.createdAt || new Date()).toLocaleDateString("th-TH")}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span>วันครบกำหนดชำระ</span>
            <span className="font-medium text-slate-700">
              {new Date(invoice.dueDate).toLocaleDateString("th-TH")}
            </span>
          </div>
          {invoice.invoiceNumber && (
            <div className="mt-1 flex items-center justify-between">
              <span>เลขที่ใบแจ้งหนี้</span>
              <span className="font-mono text-slate-700">{invoice.invoiceNumber}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
