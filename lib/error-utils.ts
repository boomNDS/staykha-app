import { FetchError } from "ofetch";
import {
  ApiError,
  NetworkError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "./api/errors";

type ErrorContext = {
  scope: string;
  action: string;
  metadata?: Record<string, unknown>;
};

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (typeof error === "string") {
    return { name: "Error", message: error };
  }
  if (typeof error === "object" && error) {
    const maybeMessage = (error as { message?: string }).message;
    return { name: "Error", message: maybeMessage ?? "Unknown error" };
  }
  return { name: "Error", message: "Unknown error" };
};

/**
 * Common error message translations (English to Thai)
 */
const ERROR_TRANSLATIONS: Record<string, string> = {
  "Unauthorized": "คุณไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่",
  "Forbidden": "คุณไม่มีสิทธิ์ในการดำเนินการนี้",
  "Not Found": "ไม่พบข้อมูลที่ต้องการ",
  "Network Error": "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
  "Network error": "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
  "Failed to fetch": "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
  "Internal Server Error": "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง",
  "Bad Request": "ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
  "Validation Error": "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
  "Validation error": "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
};

/**
 * Extract error message from various error types
 * Handles FetchError, ApiError, ValidationError, and plain errors
 */
const extractErrorMessage = (error: unknown): string => {
  // Handle FetchError (from ofetch)
  if (error instanceof FetchError) {
    // Try to get message from error.data first (API response)
    if (error.data && typeof error.data === "object") {
      const data = error.data as Record<string, unknown>;
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      // Wrapped error payload: { data: { error } }
      if (
        data.data &&
        typeof data.data === "object" &&
        typeof (data.data as { error?: unknown }).error === "string" &&
        (data.data as { error: string }).error.trim()
      ) {
        return (data.data as { error: string }).error;
      }
      // Some APIs return error in different fields
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
    }
    // Fallback to error.message
    if (error.message) {
      return error.message;
    }
    // Last resort: status-based message
    const status = error.status || error.response?.status;
    if (status === 401) return "คุณไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่";
    if (status === 403) return "คุณไม่มีสิทธิ์ในการดำเนินการนี้";
    if (status === 404) return "ไม่พบข้อมูลที่ต้องการ";
    if (status === 500) return "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง";
    return `เกิดข้อผิดพลาด (รหัส: ${status})`;
  }

  // Handle typed API errors
  if (error instanceof ValidationError) {
    return error.message || "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
  }
  if (error instanceof UnauthorizedError) {
    return error.message || "คุณไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่";
  }
  if (error instanceof ForbiddenError) {
    return error.message || "คุณไม่มีสิทธิ์ในการดำเนินการนี้";
  }
  if (error instanceof NotFoundError) {
    return error.message || "ไม่พบข้อมูลที่ต้องการ";
  }
  if (error instanceof NetworkError) {
    return error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง";
  }
  if (error instanceof ApiError) {
    return error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
  }

  // Handle plain Error
  if (error instanceof Error && error.message) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  // Handle object with message property
  if (typeof error === "object" && error) {
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage && maybeMessage.trim()) {
      return maybeMessage;
    }
    // Wrapped error payload
    const maybeWrappedError = (error as { data?: { error?: string } }).data?.error;
    if (maybeWrappedError && maybeWrappedError.trim()) {
      return maybeWrappedError;
    }
    // Some APIs return error in 'error' field
    const maybeError = (error as { error?: string }).error;
    if (maybeError && typeof maybeError === "string" && maybeError.trim()) {
      return maybeError;
    }
  }

  return "";
};

/**
 * Normalize error message for user display
 * Translates common errors and ensures user-friendly messages
 */
export const normalizeErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const message = extractErrorMessage(error);

  if (!message) {
    return fallback;
  }

  // Check if message needs translation
  const translated = ERROR_TRANSLATIONS[message];
  if (translated) {
    return translated;
  }

  // If message is already in Thai or contains Thai characters, return as is
  // Simple check: if message contains Thai Unicode range characters
  const hasThaiChars = /[\u0E00-\u0E7F]/.test(message);
  if (hasThaiChars) {
    return message;
  }

  // For English messages, try to translate common patterns
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง";
  }
  if (lowerMessage.includes("unauthorized") || lowerMessage.includes("401")) {
    return "คุณไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่";
  }
  if (lowerMessage.includes("forbidden") || lowerMessage.includes("403")) {
    return "คุณไม่มีสิทธิ์ในการดำเนินการนี้";
  }
  if (lowerMessage.includes("not found") || lowerMessage.includes("404")) {
    return "ไม่พบข้อมูลที่ต้องการ";
  }
  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) {
    return "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
  }
  if (lowerMessage.includes("server error") || lowerMessage.includes("500")) {
    return "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง";
  }

  // Return original message if no translation found
  return message;
};

/**
 * Get error message (legacy function, kept for backward compatibility)
 * @deprecated Use normalizeErrorMessage instead for better user experience
 */
export const getErrorMessage = (error: unknown, fallback: string) => {
  return normalizeErrorMessage(error, fallback);
};

/**
 * Extract field-specific validation errors
 * Returns a record of field names to error messages
 */
export const getFieldErrors = (error: unknown): Record<string, string> => {
  // Handle ValidationError with fieldErrors
  if (error instanceof ValidationError && error.fieldErrors) {
    return error.fieldErrors;
  }

  // Handle FetchError with fieldErrors in data
  if (error instanceof FetchError) {
    if (error.data && typeof error.data === "object") {
      const data = error.data as Record<string, unknown>;
      // Wrapped errors: { data: { fieldErrors/errors } }
      if (data.data && typeof data.data === "object") {
        const wrapped = data.data as Record<string, unknown>;
        if (wrapped.fieldErrors && typeof wrapped.fieldErrors === "object") {
          return wrapped.fieldErrors as Record<string, string>;
        }
        if (wrapped.errors && typeof wrapped.errors === "object") {
          return wrapped.errors as Record<string, string>;
        }
      }
      if (data.fieldErrors && typeof data.fieldErrors === "object") {
        return data.fieldErrors as Record<string, string>;
      }
      // Some APIs return errors in 'errors' field
      if (data.errors && typeof data.errors === "object") {
        return data.errors as Record<string, string>;
      }
    }
  }

  // Handle object with fieldErrors property
  if (typeof error === "object" && error) {
    const obj = error as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object") {
      const wrapped = obj.data as Record<string, unknown>;
      if (wrapped.fieldErrors && typeof wrapped.fieldErrors === "object") {
        return wrapped.fieldErrors as Record<string, string>;
      }
      if (wrapped.errors && typeof wrapped.errors === "object") {
        return wrapped.errors as Record<string, string>;
      }
    }
    if (obj.fieldErrors && typeof obj.fieldErrors === "object") {
      return obj.fieldErrors as Record<string, string>;
    }
    if (obj.errors && typeof obj.errors === "object") {
      return obj.errors as Record<string, string>;
    }
  }

  return {};
};

export const logError = (error: unknown, context: ErrorContext) => {
  if (!import.meta.env.DEV) {
    return;
  }
  console.error(`[${context.scope}] ${context.action}`, {
    error: normalizeError(error),
    ...context.metadata,
  });
};
