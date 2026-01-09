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
  const subtotal = invoice.subtotal ?? (waterSubtotal + electricSubtotal + (roomRent ?? 0));
  const tax = invoice.tax ?? 0;
  const total = invoice.total ?? (subtotal + tax);
  const isWaterFixed = invoice.waterBillingMode === "fixed";
  const taxRate = settings?.taxRate ?? 0;

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
      <div className="w-full max-w-full space-y-3 rounded-lg border border-border bg-white p-3 text-xs text-slate-900 shadow-sm print:p-4 print:max-w-none print:text-sm">
        {/* Header */}
        <div className="text-center">
          <p className="text-lg font-bold print:text-xl">{labelInvoice}</p>
          <p className="mt-1 text-sm font-semibold print:text-base">ห้องเลขที่ {roomLabel}</p>
          <p className="mt-0.5 text-[10px] text-slate-500 print:text-xs">
            {new Date(invoice.issueDate || invoice.createdAt || new Date()).toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Billing Table */}
        <div className="overflow-x-auto rounded-md border-2 border-slate-300">
          <table className="w-full min-w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[25%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[39%]" />
            </colgroup>
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-1.5 py-1.5 text-left font-semibold text-[10px] print:px-2 print:py-1.5 print:text-xs">รายการ</th>
                <th className="px-1.5 py-1.5 text-center font-semibold text-[10px] print:px-2 print:py-1.5 print:text-xs">เลขมิเตอร์ก่อน</th>
                <th className="px-1.5 py-1.5 text-center font-semibold text-[10px] print:px-2 print:py-1.5 print:text-xs">เลขมิเตอร์หลัง</th>
                <th className="px-1.5 py-1.5 text-right font-semibold text-[10px] print:px-2 print:py-1.5 print:text-xs whitespace-nowrap">จำนวนเงินรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Room Rent */}
              {roomRent && roomRent > 0 && (
                <tr>
                  <td className="px-1.5 py-1.5 font-medium text-[10px] print:px-2 print:py-1.5 print:text-xs">{labelRoomRent}</td>
                  <td className="px-1.5 py-1.5 text-center text-slate-400 text-[10px] print:px-2 print:py-1.5 print:text-xs">—</td>
                  <td className="px-1.5 py-1.5 text-center text-slate-400 text-[10px] print:px-2 print:py-1.5 print:text-xs">—</td>
                  <td className="px-1.5 py-1.5 text-right font-mono font-semibold text-[10px] print:px-2 print:py-1.5 print:text-xs whitespace-nowrap">
                    {formatCurrency(roomRent, settings?.currency || "THB")}
                  </td>
                </tr>
              )}
              
              {/* Water */}
              <tr>
                <td className="px-1.5 py-1.5 font-medium text-[10px] print:px-2 print:py-1.5 print:text-xs">
                  {labelWater} {isWaterFixed ? "(ค่าบริการ)" : ""}
                </td>
                <td className="px-1.5 py-1.5 text-center text-slate-600 text-[10px] print:px-2 print:py-1.5 print:text-xs">
                  {isWaterFixed 
                    ? "—" 
                    : (waterReading?.previousReading != null 
                        ? waterReading.previousReading.toLocaleString() 
                        : "—")}
                </td>
                <td className="px-1.5 py-1.5 text-center text-slate-600 text-[10px] print:px-2 print:py-1.5 print:text-xs">
                  {isWaterFixed 
                    ? "—" 
                    : (waterReading?.currentReading != null 
                        ? waterReading.currentReading.toLocaleString() 
                        : "—")}
                </td>
                <td className="px-1.5 py-1.5 text-right font-mono font-semibold text-[10px] print:px-2 print:py-1.5 print:text-xs whitespace-nowrap">
                  {formatCurrency(waterSubtotal, settings?.currency || "THB")}
                </td>
              </tr>
              
              {/* Electricity */}
              <tr>
                <td className="px-1.5 py-1.5 font-medium text-[10px] print:px-2 print:py-1.5 print:text-xs">{labelElectricity}</td>
                <td className="px-1.5 py-1.5 text-center text-slate-600 text-[10px] print:px-2 print:py-1.5 print:text-xs">
                  {electricReading?.previousReading != null 
                    ? electricReading.previousReading.toLocaleString() 
                    : "—"}
                </td>
                <td className="px-1.5 py-1.5 text-center text-slate-600 text-[10px] print:px-2 print:py-1.5 print:text-xs">
                  {electricReading?.currentReading != null 
                    ? electricReading.currentReading.toLocaleString() 
                    : "—"}
                </td>
                <td className="px-1.5 py-1.5 text-right font-mono font-semibold text-[10px] print:px-2 print:py-1.5 print:text-xs whitespace-nowrap">
                  {formatCurrency(electricSubtotal, settings?.currency || "THB")}
                </td>
              </tr>
              
              {/* Subtotal */}
              <tr>
                <td className="px-1.5 py-1.5 font-medium text-[10px] print:px-2 print:py-1.5 print:text-xs" colSpan={3}>
                  รวมย่อย
                </td>
                <td className="px-1.5 py-1.5 text-right font-mono font-semibold text-[10px] print:px-2 print:py-1.5 print:text-xs whitespace-nowrap">
                  {formatCurrency(subtotal, settings?.currency || "THB")}
                </td>
              </tr>
              
              {/* Tax */}
              {tax > 0 && taxRate > 0 && (
                <tr>
                  <td className="px-1.5 py-1.5 font-medium text-[10px] print:px-2 print:py-1.5 print:text-xs" colSpan={3}>
                    ภาษีมูลค่าเพิ่ม ({taxRate}%)
                  </td>
                  <td className="px-1.5 py-1.5 text-right font-mono font-semibold text-[10px] print:px-2 print:py-1.5 print:text-xs whitespace-nowrap">
                    {formatCurrency(tax, settings?.currency || "THB")}
                  </td>
                </tr>
              )}
              
              {/* Total */}
              <tr className="bg-slate-50">
                <td className="px-1.5 py-1.5 font-bold text-xs print:px-2 print:py-1.5 print:text-sm">{labelTotal}</td>
                <td className="px-1.5 py-1.5 text-center text-slate-400 text-[10px] print:px-2 print:py-1.5 print:text-xs">—</td>
                <td className="px-1.5 py-1.5 text-center text-slate-400 text-[10px] print:px-2 print:py-1.5 print:text-xs">—</td>
                <td className="px-1.5 py-1.5 text-right font-mono font-bold text-xs print:px-2 print:py-1.5 print:text-sm whitespace-nowrap">
                  {formatCurrency(total, settings?.currency || "THB")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Instructions */}
        <div className="space-y-2 border-t-2 border-slate-300 pt-2 print:space-y-2.5 print:pt-3">
          <div className="space-y-1">
            <p className="font-semibold text-slate-900 text-[10px] print:text-xs">
              วันสุดท้ายที่ต้องชำระ : {dueDateMessage}
            </p>
            {penaltyMessage && (
              <p className="font-bold text-red-600 text-[10px] print:text-xs">
                {penaltyMessage}
              </p>
            )}
          </div>
          
          {/* Banking Information */}
          {(bankName || bankAccountNumber || lineId) && (
            <div className="space-y-0.5">
              {(bankName || bankAccountNumber) && (
                <p className="font-medium text-slate-700 text-[10px] print:text-xs">
                  {bankName && bankAccountNumber ? (
                    <>ชำระเงินได้ที่ {bankName} เลขบัญชี {bankAccountNumber}</>
                  ) : bankName ? (
                    <>ชำระเงินได้ที่ {bankName}</>
                  ) : bankAccountNumber ? (
                    <>เลขบัญชี {bankAccountNumber}</>
                  ) : null}
                </p>
              )}
              {lineId && (
                <p className="font-medium text-slate-700 text-[10px] print:text-xs">
                  ไอดีไลน์ {lineId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500 print:pt-2.5 print:text-xs">
          <div className="flex items-center justify-between">
            <span>วันที่ออกบิล</span>
            <span className="font-medium text-slate-700">
              {new Date(invoice.issueDate || invoice.createdAt || new Date()).toLocaleDateString("th-TH")}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between print:mt-1">
            <span>วันครบกำหนดชำระ</span>
            <span className="font-medium text-slate-700">
              {new Date(invoice.dueDate).toLocaleDateString("th-TH")}
            </span>
          </div>
          {invoice.invoiceNumber && (
            <div className="mt-0.5 flex items-center justify-between print:mt-1">
              <span>เลขที่ใบแจ้งหนี้</span>
              <span className="font-mono text-slate-700">{invoice.invoiceNumber}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
