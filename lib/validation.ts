// Validation utilities for meter readings

import type { ValidationError } from "./types";

export interface MeterReadingValidation {
  previousReading: number;
  currentReading: number;
  lastBilledReading?: number;
  meterType?: "water" | "electric";
}

/**
 * Validates meter readings
 * @returns Array of validation errors (empty if valid)
 */
export function validateMeterReading({
  previousReading,
  currentReading,
  lastBilledReading,
  meterType,
}: MeterReadingValidation): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if current reading is greater than or equal to previous
  if (currentReading < previousReading) {
    errors.push({
      field: "currentReading",
      message: "เลขล่าสุดต้องมากกว่าหรือเท่ากับเลขก่อนหน้า",
    });
  }

  // Check if readings are the same
  if (currentReading === previousReading) {
    errors.push({
      field: "currentReading",
      message: "เลขล่าสุดและเลขก่อนหน้าต้องไม่เท่ากัน",
    });
  }

  // Check against last billed reading to prevent duplicates
  if (lastBilledReading !== undefined && currentReading <= lastBilledReading) {
    errors.push({
      field: "currentReading",
      message: `เลขล่าสุดต้องมากกว่าเลขที่ออกบิลล่าสุด (${lastBilledReading})`,
    });
  }

  // Validate meter type
  if (meterType && meterType !== "water" && meterType !== "electric") {
    errors.push({
      field: "meterType",
      message: "ประเภทมิเตอร์ต้องเป็น 'water' หรือ 'electric'",
    });
  }

  return errors;
}

/**
 * Checks if meter reading already exists for a room in the current billing period
 */
export async function checkDuplicateReading(
  roomId: string,
  readingDate: Date,
): Promise<boolean> {
  // API call to check for duplicate readings
  // This would be implemented based on your backend
  try {
    const response = await fetch(
      `/api/readings/check-duplicate?roomId=${roomId}&date=${readingDate.toISOString()}`,
    );
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Error checking duplicate reading:", error);
    return false;
  }
}

/**
 * Calculates consumption from meter readings
 */
export function calculateConsumption(
  previousReading: number,
  currentReading: number,
): number {
  return Math.max(0, currentReading - previousReading);
}

/**
 * Validates image file for meter photo upload
 */
export function validateImageFile(file: File): ValidationError | null {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      field: "file",
      message: "รองรับเฉพาะไฟล์ JPEG, PNG และ WebP เท่านั้น",
    };
  }

  if (file.size > maxSize) {
    return {
      field: "file",
      message: "ขนาดไฟล์ต้องไม่เกิน 5MB",
    };
  }

  return null;
}
