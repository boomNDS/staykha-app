import type { Invoice } from "@/lib/types";
import type { AdminSettings } from "@/lib/types";
import { WaterBillingMode } from "@/lib/types";

/**
 * Get room label from invoice (tries multiple sources)
 */
export function getInvoiceRoomLabel(invoice: Invoice): string {
  return (
    invoice.room?.roomNumber ||
    invoice.roomNumber ||
    (invoice.room as any)?.roomNumber ||
    invoice.roomId ||
    "—"
  );
}

/**
 * Get water reading from invoice (tries multiple sources)
 */
export function getWaterReading(invoice: Invoice) {
  // First try readings array
  const fromReadings = invoice.readings?.find((reading) => {
    const type = String(reading?.meterType || "").toLowerCase();
    return type === "water";
  });
  if (fromReadings) return fromReadings;

  // Then try readingGroup.meterReadings
  const fromGroup = invoice.readingGroup?.meterReadings?.find((reading) => {
    const type = String(reading?.meterType || "").toLowerCase();
    return type === "water";
  });
  if (fromGroup) {
    return {
      previousReading:
        typeof fromGroup.previousReading === "string"
          ? Number.parseFloat(fromGroup.previousReading)
          : fromGroup.previousReading,
      currentReading:
        typeof fromGroup.currentReading === "string"
          ? Number.parseFloat(fromGroup.currentReading)
          : fromGroup.currentReading,
      consumption:
        typeof fromGroup.consumption === "string"
          ? Number.parseFloat(fromGroup.consumption)
          : fromGroup.consumption,
    };
  }
  return null;
}

/**
 * Get electric reading from invoice (tries multiple sources)
 */
export function getElectricReading(invoice: Invoice) {
  // First try readings array
  const fromReadings = invoice.readings?.find((reading) => {
    const type = String(reading?.meterType || "").toLowerCase();
    return type === "electric" || type === "electricity";
  });
  if (fromReadings) return fromReadings;

  // Then try readingGroup.meterReadings
  const fromGroup = invoice.readingGroup?.meterReadings?.find((reading) => {
    const type = String(reading?.meterType || "").toLowerCase();
    return type === "electric" || type === "electricity";
  });
  if (fromGroup) {
    return {
      previousReading:
        typeof fromGroup.previousReading === "string"
          ? Number.parseFloat(fromGroup.previousReading)
          : fromGroup.previousReading,
      currentReading:
        typeof fromGroup.currentReading === "string"
          ? Number.parseFloat(fromGroup.currentReading)
          : fromGroup.currentReading,
      consumption:
        typeof fromGroup.consumption === "string"
          ? Number.parseFloat(fromGroup.consumption)
          : fromGroup.consumption,
    };
  }
  return null;
}

/**
 * Calculate invoice amounts from invoice data
 */
export function calculateInvoiceAmounts(invoice: Invoice) {
  const roomRent = invoice.roomRent ?? invoice.room?.monthlyRent ?? null;
  const waterSubtotal = invoice.waterSubtotal ?? invoice.waterAmount ?? 0;
  const electricSubtotal =
    invoice.electricSubtotal ?? invoice.electricAmount ?? 0;
  const subtotal =
    invoice.subtotal ?? waterSubtotal + electricSubtotal + (roomRent ?? 0);
  const tax = invoice.tax ?? 0;
  const total = invoice.total ?? subtotal + tax;

  return {
    roomRent,
    waterSubtotal,
    electricSubtotal,
    subtotal,
    tax,
    total,
  };
}

/**
 * Get invoice labels from settings with fallbacks
 */
export function getInvoiceLabels(settings?: AdminSettings | null) {
  return {
    invoice: settings?.labelInvoice || "ใบแจ้งหนี้",
    roomRent: settings?.labelRoomRent || "ค่าเช่าห้อง",
    water: settings?.labelWater || "ค่าน้ำประปา",
    electricity: settings?.labelElectricity || "ค่าไฟฟ้า",
    total: "จำนวนเงินรวม",
  };
}

/**
 * Get invoice metadata (flags, rates, etc.)
 */
export function getInvoiceMetadata(
  invoice: Invoice,
  settings?: AdminSettings | null,
) {
  const isWaterFixed = invoice.waterBillingMode === WaterBillingMode.FIXED;
  const taxRate = settings?.taxRate ?? 0;

  return {
    isWaterFixed,
    taxRate,
  };
}

/**
 * Format meter reading value for display
 */
export function formatMeterReading(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}
