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

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (typeof error === "object" && error) {
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) return maybeMessage;
  }
  return fallback;
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
