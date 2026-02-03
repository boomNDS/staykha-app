import { BaseApiService } from "../base-service";
import { ApiError } from "../errors";
import type { AdminSettings } from "@/lib/types";
import { WaterBillingMode } from "@/lib/types";
import type {
  SettingsCreateRequest,
  SettingsResponse,
  SettingsUpdateRequest,
  SettingsUpdateResponse,
} from "./settings-types";
import { getData } from "../response-helpers";

// Helper to map API response (string numbers, uppercase enums) to AdminSettings type
function mapSettingsFromApi(apiSettings: any): AdminSettings {
  return {
    ...apiSettings,
    // Convert string numbers to actual numbers
    waterRatePerUnit:
      typeof apiSettings.waterRatePerUnit === "string"
        ? Number.parseFloat(apiSettings.waterRatePerUnit)
        : apiSettings.waterRatePerUnit ?? 20,
    waterBillingMode:
      apiSettings.waterBillingMode?.toUpperCase() === WaterBillingMode.FIXED
        ? WaterBillingMode.FIXED
        : WaterBillingMode.METERED,
    waterFixedFee:
      apiSettings.waterFixedFee === null || apiSettings.waterFixedFee === undefined
        ? 0
        : typeof apiSettings.waterFixedFee === "string"
          ? Number.parseFloat(apiSettings.waterFixedFee)
          : apiSettings.waterFixedFee,
    electricRatePerUnit:
      typeof apiSettings.electricRatePerUnit === "string"
        ? Number.parseFloat(apiSettings.electricRatePerUnit)
        : apiSettings.electricRatePerUnit ?? 5,
    taxRate:
      typeof apiSettings.taxRate === "string"
        ? Number.parseFloat(apiSettings.taxRate)
        : apiSettings.taxRate ?? 7,
    paymentTermsDays:
      typeof apiSettings.paymentTermsDays === "string"
        ? Number.parseInt(apiSettings.paymentTermsDays, 10)
        : apiSettings.paymentTermsDays ?? 7,
    defaultRoomRent:
      typeof apiSettings.defaultRoomRent === "string"
        ? Number.parseFloat(apiSettings.defaultRoomRent)
        : apiSettings.defaultRoomRent ?? 5000,
    defaultRoomSize:
      typeof apiSettings.defaultRoomSize === "string"
        ? Number.parseFloat(apiSettings.defaultRoomSize)
        : apiSettings.defaultRoomSize ?? 25,
    latePaymentPenaltyPerDay:
      apiSettings.latePaymentPenaltyPerDay === null ||
      apiSettings.latePaymentPenaltyPerDay === undefined
        ? undefined
        : typeof apiSettings.latePaymentPenaltyPerDay === "string"
          ? Number.parseFloat(apiSettings.latePaymentPenaltyPerDay)
          : apiSettings.latePaymentPenaltyPerDay,
    dueDateDayOfMonth:
      apiSettings.dueDateDayOfMonth === null ||
      apiSettings.dueDateDayOfMonth === undefined
        ? undefined
        : typeof apiSettings.dueDateDayOfMonth === "string"
          ? Number.parseInt(apiSettings.dueDateDayOfMonth, 10)
          : apiSettings.dueDateDayOfMonth,
    // Handle optional string fields (convert null to empty string or undefined)
    bankName: apiSettings.bankName ?? undefined,
    bankAccountNumber: apiSettings.bankAccountNumber ?? undefined,
    lineId: apiSettings.lineId ?? undefined,
    labelInvoice: apiSettings.labelInvoice ?? undefined,
    labelRoomRent: apiSettings.labelRoomRent ?? undefined,
    labelWater: apiSettings.labelWater ?? undefined,
    labelElectricity: apiSettings.labelElectricity ?? undefined,
  };
}

class SettingsApi extends BaseApiService {
  /**
   * GET /v1/settings
   * Get team settings (auto-creates default if doesn't exist)
   * Team ID is inferred from the authenticated user's token
   */
  async get(teamId: string, token?: string): Promise<SettingsResponse> {
    try {
      const api = this.createApi(token);
      // GET /v1/settings - teamId inferred from token, but we keep it for consistency
      const response = await api.get<SettingsResponse>("/settings");
      // Map the API response to match AdminSettings type
      const settingsData = getData(response);
      if (settingsData && typeof settingsData === "object") {
        return { ...response, data: mapSettingsFromApi(settingsData) };
      }
      return { data: null };
    } catch (error: unknown) {
      // Handle 404 as null settings (not an error)
      if (error instanceof ApiError && error.statusCode === 404) {
        return { data: null };
      }
      this.handleError(error, "get", { teamId });
    }
  }

  /**
   * PATCH /v1/settings
   * Update team settings
   * Team ID is inferred from the authenticated user's token
   */
  async update(
    teamId: string,
    updates: SettingsUpdateRequest,
    token?: string,
  ): Promise<SettingsUpdateResponse> {
    try {
      const api = this.createApi(token);
      // PATCH /v1/settings - teamId inferred from token
      const response = await api.patch<SettingsUpdateResponse>("/settings", updates);
      // Map the API response to match AdminSettings type
      const settingsData = getData(response);
      if (settingsData && typeof settingsData === "object") {
        return { ...response, data: mapSettingsFromApi(settingsData) };
      }
      throw new Error("Invalid response from settings update");
    } catch (error: unknown) {
      this.handleError(error, "update", { teamId });
    }
  }

  /**
   * POST /v1/settings/initialize
   * Manually initialize default settings
   * Team ID is inferred from the authenticated user's token
   */
  async initialize(token?: string): Promise<SettingsUpdateResponse> {
    try {
      const api = this.createApi(token);
      return api.post<SettingsUpdateResponse>("/settings/initialize", {});
    } catch (error: unknown) {
      this.handleError(error, "initialize");
    }
  }

  /**
   * @deprecated Use GET /v1/settings instead (auto-creates defaults)
   * Kept for backward compatibility
   */
  async create(
    teamId: string,
    data: SettingsCreateRequest,
    token?: string,
  ): Promise<SettingsUpdateResponse> {
    try {
      const api = this.createApi(token);
      // Fallback to initialize if create is still called
      return api.post<SettingsUpdateResponse>("/settings/initialize", {});
    } catch (error: unknown) {
      this.handleError(error, "create", { teamId });
    }
  }
}

export const settingsApi = new SettingsApi();
