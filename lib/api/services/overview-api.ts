import { BaseApiService } from "../base-service";
import type { OverviewResponse } from "./overview-types";

class OverviewApi extends BaseApiService {
  /**
   * GET /v1/overview
   * Get dashboard overview data
   * Returns summary statistics, revenue, and recent data
   */
  async get(token?: string): Promise<OverviewResponse> {
    try {
      const api = this.createApi(token);
      // API returns direct object
      const response = await api.get<OverviewResponse>("/overview");
      return response;
    } catch (error: unknown) {
      this.handleError(error, "get");
    }
  }
}

export const overviewApi = new OverviewApi();
