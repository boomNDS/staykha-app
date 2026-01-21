/**
 * Environment variable validation
 */

const requiredEnvVars = ["VITE_API_URL"] as const;

type EnvVar = (typeof requiredEnvVars)[number];

/**
 * Get and validate environment variable
 */
function getEnvVar(name: EnvVar): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Please set it in your .env file.`,
    );
  }
  return value;
}

/**
 * Get API URL with validation
 */
export function getApiUrl(): string {
  const url = getEnvVar("VITE_API_URL");
  // Remove trailing slash if present
  return url.replace(/\/$/, "");
}

/**
 * Validate all required environment variables on app startup
 * Call this early in the app initialization
 */
export function validateEnv(): void {
  if (typeof window === "undefined") {
    // Server-side, skip validation
    return;
  }

  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please create a .env file with these variables.`,
    );
    // Don't throw in production to avoid breaking the app
    if (import.meta.env.DEV) {
      console.warn(
        "App may not work correctly without these environment variables.",
      );
    }
  }
}
