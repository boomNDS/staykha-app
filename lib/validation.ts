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
      message:
        "Current reading must be greater than or equal to previous reading",
    });
  }

  // Check if readings are the same
  if (currentReading === previousReading) {
    errors.push({
      field: "currentReading",
      message: "Current and previous readings cannot be the same",
    });
  }

  // Check against last billed reading to prevent duplicates
  if (lastBilledReading !== undefined && currentReading <= lastBilledReading) {
    errors.push({
      field: "currentReading",
      message: `Current reading must be greater than the last billed reading (${lastBilledReading})`,
    });
  }

  // Validate meter type
  if (meterType && meterType !== "water" && meterType !== "electric") {
    errors.push({
      field: "meterType",
      message: "Meter type must be either 'water' or 'electric'",
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
      message: "Only JPEG, PNG, and WebP images are allowed",
    };
  }

  if (file.size > maxSize) {
    return {
      field: "file",
      message: "File size must be less than 5MB",
    };
  }

  return null;
}
