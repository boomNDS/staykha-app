"use client";

import { useSettings } from "@/lib/hooks/use-settings";
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
  const subtotal =
    invoice.subtotal ?? waterSubtotal + electricSubtotal + (roomRent ?? 0);
  const tax = invoice.tax ?? 0;
  const total = invoice.total ?? subtotal + tax;
  const isWaterFixed = invoice.waterBillingMode === "fixed";
  const taxRate = settings?.taxRate ?? 0;

  const labelInvoice = settings?.labelInvoice || "ใบแจ้งหนี้";
  const labelRoomRent = settings?.labelRoomRent || "ค่าเช่าห้อง";
  const labelWater = settings?.labelWater || "ค่าน้ำประปา";
  const labelElectricity = settings?.labelElectricity || "ค่าไฟฟ้า";
  const labelTotal = "จำนวนเงินรวม";

  const bankName = settings?.bankName || "";
  const bankAccountNumber = settings?.bankAccountNumber || "";
  const lineId = settings?.lineId || "";
  const latePaymentPenalty = settings?.latePaymentPenaltyPerDay || 0;
  const dueDateDay = settings?.dueDateDayOfMonth || 5;

  const dueDateMessage = `ภายในวันที่ ${dueDateDay} ของทุกเดือน`;
  const penaltyMessage =
    latePaymentPenalty > 0
      ? `หากเกินกำหนด ชำระค่าปรับวันละ ${formatCurrency(
          latePaymentPenalty,
          settings?.currency || "THB",
        )}`
      : "";

  const issueDate = new Date(
    invoice.issueDate || invoice.createdAt || new Date(),
  );
  const formattedIssueDate = issueDate.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={className}>
      <div className="flex h-full w-full flex-col gap-6 rounded-xl border border-border bg-white p-6 text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.08)] print:p-8">
        <header className="space-y-2 text-center">
          <p className="text-3xl font-black tracking-tight print:text-3xl">
            {labelInvoice}
          </p>
          <p className="text-xl font-semibold text-slate-700 print:text-2xl">
            ห้องเลขที่ {roomLabel}
          </p>
          <p className="text-sm text-slate-500 print:text-base">
            {formattedIssueDate}
          </p>
        </header>

        <div className="grid gap-4 text-sm text-slate-600 print:text-base sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500 print:text-[10px]">
              รอบบิล
            </p>
            <p className="text-base font-semibold text-slate-900">
              {invoice.billingPeriod || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500 print:text-[10px]">
              สถานะ
            </p>
            <p className="text-base font-semibold text-slate-900 capitalize">
              {invoice.status}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <div className="grid grid-cols-4 gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:text-xs">
            <span className="col-span-2 text-left">รายการ</span>
            <span className="text-center">ก่อนหน้า</span>
            <span className="text-right">จำนวนเงิน</span>
          </div>
          <div className="space-y-2 px-4 py-4 text-[11px] text-slate-800 print:text-xs">
            {roomRent && roomRent > 0 && (
              <div className="grid grid-cols-4 gap-2 font-semibold text-slate-900">
                <span className="col-span-2">{labelRoomRent}</span>
                <span className="text-center text-xs text-slate-500">—</span>
                <span className="text-right">
                  {formatCurrency(roomRent, settings?.currency || "THB")}
                </span>
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              <span className="col-span-2 font-semibold text-slate-900">
                {labelWater} {isWaterFixed ? "(ค่าบริการ)" : ""}
              </span>
              <span className="text-center text-xs text-slate-500">
                {isWaterFixed
                  ? "—"
                  : waterReading?.previousReading != null
                    ? waterReading.previousReading.toLocaleString()
                    : "—"}
              </span>
              <span className="text-right font-semibold text-slate-900">
                {formatCurrency(waterSubtotal, settings?.currency || "THB")}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <span className="col-span-2 font-semibold text-slate-900">
                {labelElectricity}
              </span>
              <span className="text-center text-xs text-slate-500">
                {electricReading?.previousReading != null
                  ? electricReading.previousReading.toLocaleString()
                  : "—"}
              </span>
              <span className="text-right font-semibold text-slate-900">
                {formatCurrency(electricSubtotal, settings?.currency || "THB")}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm print:text-base">
          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 print:text-[10px]">
              ยอดรวมย่อย
            </span>
            <span className="text-right font-semibold text-slate-900">
              {formatCurrency(subtotal, settings?.currency || "THB")}
            </span>
          </div>
          {tax > 0 && taxRate > 0 && (
            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <span className="text-[11px] uppercase tracking-wide text-slate-500 print:text-[10px]">
                ภาษีมูลค่าเพิ่ม ({taxRate}%)
              </span>
              <span className="text-right font-semibold text-slate-900">
                {formatCurrency(tax, settings?.currency || "THB")}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 print:text-[10px]">
              {labelTotal}
            </span>
            <span className="text-right text-2xl font-bold text-slate-900">
              {formatCurrency(total, settings?.currency || "THB")}
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-700 print:text-base">
          <p className="text-sm font-semibold text-slate-900 print:text-lg">
            กรุณาชำระภายใน {dueDateMessage}
          </p>
          {penaltyMessage && (
            <p className="text-sm font-semibold text-red-600 print:text-base">
              {penaltyMessage}
            </p>
          )}
          {(bankName || bankAccountNumber || lineId) && (
            <div className="space-y-1 text-base font-medium text-slate-900">
              {(bankName || bankAccountNumber) && (
                <p>
                  {bankName && bankAccountNumber ? (
                    <>
                      ชำระเงินได้ที่ {bankName} เลขบัญชี {bankAccountNumber}
                    </>
                  ) : bankName ? (
                    <>ชำระเงินได้ที่ {bankName}</>
                  ) : bankAccountNumber ? (
                    <>เลขบัญชี {bankAccountNumber}</>
                  ) : null}
                </p>
              )}
              {lineId && <p>Line: {lineId}</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
