import { BaseApiService } from "../base-service";
import type { MeterReading, MeterReadingGroup } from "@/lib/types";
import type {
  CreateReadingData,
  ReadingResponse,
  ReadingUpdateRequest,
  ReadingsListResponse,
} from "./readings-types";

// Helper to map API response (string numbers, uppercase enums) to MeterReading type
function mapReadingFromApi(apiReading: any): MeterReading & { readingGroupId?: string | null } {
  return {
    ...apiReading,
    // Convert string numbers to actual numbers
    previousReading:
      typeof apiReading.previousReading === "string"
        ? Number.parseFloat(apiReading.previousReading)
        : apiReading.previousReading ?? 0,
    currentReading:
      typeof apiReading.currentReading === "string"
        ? Number.parseFloat(apiReading.currentReading)
        : apiReading.currentReading ?? 0,
    consumption:
      typeof apiReading.consumption === "string"
        ? Number.parseFloat(apiReading.consumption)
        : apiReading.consumption ?? 0,
    // Convert uppercase status to lowercase
    status: (apiReading.status?.toLowerCase() ?? "pending") as
      | "pending"
      | "billed"
      | "paid",
    // Convert uppercase meterType to lowercase
    meterType: (apiReading.meterType?.toLowerCase() ?? "water") as
      | "water"
      | "electric",
    // Preserve readingGroupId from API (may be null)
    readingGroupId: apiReading.readingGroupId,
  };
}

// Helper to group individual readings into MeterReadingGroup objects
function groupReadings(readings: (MeterReading & { readingGroupId?: string | null })[]): MeterReadingGroup[] {
  const groupsMap = new Map<string, MeterReadingGroup>();

  readings.forEach((reading) => {
    // Create a unique key for grouping: roomId + readingDate (YYYY-MM-DD)
    const dateKey = reading.readingDate.slice(0, 10); // Extract YYYY-MM-DD
    const groupKey = `${reading.roomId}-${dateKey}`;

    if (!groupsMap.has(groupKey)) {
      // Extract tenant name from multiple possible sources
      const tenantName =
        reading.tenant?.name ||
        reading.tenantName ||
        reading.room?.tenant?.name ||
        null;

      // Get readingGroupId from the extended reading object (if available)
      const readingGroupId = (reading as any).readingGroupId;

      // Create a new group
      const group: MeterReadingGroup = {
        id: readingGroupId || `${groupKey}-${Date.now()}`, // Use readingGroupId if available, otherwise generate
        roomId: reading.roomId,
        roomNumber: reading.room?.roomNumber || reading.roomNumber,
        tenantName: tenantName || undefined,
        readingDate: reading.readingDate,
        status: "incomplete" as const, // Will be updated based on readings
        water: undefined,
        electric: undefined,
        teamId: reading.room?.teamId || "", // Extract from room if available
      };
      groupsMap.set(groupKey, group);
    }

    const group = groupsMap.get(groupKey)!;

    // Add the reading to the appropriate field
    if (reading.meterType === "water") {
      group.water = reading;
    } else if (reading.meterType === "electric") {
      group.electric = reading;
    }

    // Update status based on readings
    const hasElectric = Boolean(group.electric);
    const hasWater = Boolean(group.water);
    if (hasElectric && hasWater) {
      group.status = "pending";
    } else {
      group.status = "incomplete";
    }
  });

  return Array.from(groupsMap.values());
}

class ReadingsApi extends BaseApiService {
  /**
   * GET /v1/readings
   * Returns individual readings array, which we group into MeterReadingGroup objects
   */
  async getAll(token?: string): Promise<ReadingsListResponse> {
    try {
      const api = this.createApi(token);
      // API returns direct object with readings array: { readings: MeterReading[] }
      const response = await api.get<{ readings: any[] }>("/readings");
      
      if (response?.readings && Array.isArray(response.readings)) {
        // Map each reading from API format to frontend format
        const mappedReadings = response.readings.map(mapReadingFromApi);
        // Group readings into MeterReadingGroup objects
        const groupedReadings = groupReadings(mappedReadings);
        // Return in the expected format
        return { data: groupedReadings } as ReadingsListResponse;
      }
      
      return { data: [] } as ReadingsListResponse;
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<ReadingResponse> {
    try {
      const api = this.createApi(token);
      return api.get<ReadingResponse>(`/readings/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async getByRoomDate(
    roomId: string,
    readingDate: string,
    token?: string,
  ): Promise<{ reading: MeterReadingGroup | null }> {
    try {
      const api = this.createApi(token);
      const response = await api.get<ReadingResponse | ReadingsListResponse>(
        "/readings",
        {
          params: { roomId, readingDate },
        },
      );
      const data = response as Record<string, unknown>;
      const reading = (data.reading ??
        data.item ??
        data.data ??
        data.result) as MeterReadingGroup | null | undefined;
      if (reading && typeof reading === "object") {
        return { reading };
      }
      const list =
        (data.readings as MeterReadingGroup[] | undefined) ??
        (data.items as MeterReadingGroup[] | undefined) ??
        (data.data as MeterReadingGroup[] | undefined) ??
        (data.results as MeterReadingGroup[] | undefined) ??
        [];
      return { reading: list[0] ?? null };
    } catch (error: unknown) {
      this.handleError(error, "getByRoomDate", { roomId, readingDate });
    }
  }

  /**
   * POST /v1/readings/batch
   * Create multiple meter readings (water and/or electric)
   * The API infers meterType from the key name (water/electric)
   * Consumption is calculated automatically
   */
  async create(
    data: CreateReadingData,
    token?: string,
  ): Promise<{ readings: MeterReading[] }> {
    try {
      const api = this.createApi(token);
      // Remove meterType and consumption from payload - API infers/calculates these
      const payload = {
        roomId: data.roomId,
        readingDate: data.readingDate,
        ...(data.water && {
          water: {
            previousReading: (data.water as any).previousReading,
            currentReading: (data.water as any).currentReading,
            previousPhotoUrl: (data.water as any).previousPhotoUrl || null,
            currentPhotoUrl: (data.water as any).currentPhotoUrl || null,
          },
        }),
        ...(data.electric && {
          electric: {
            previousReading: (data.electric as any).previousReading,
            currentReading: (data.electric as any).currentReading,
            previousPhotoUrl: (data.electric as any).previousPhotoUrl || null,
            currentPhotoUrl: (data.electric as any).currentPhotoUrl || null,
          },
        }),
      };
      return api.post<{ readings: MeterReading[] }>("/readings/batch", payload);
    } catch (error: unknown) {
      this.handleError(error, "create", { roomId: data.roomId });
    }
  }

  async update(
    id: string,
    updates: ReadingUpdateRequest,
    token?: string,
  ): Promise<ReadingResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<ReadingResponse>(`/readings/${id}`, updates);
    } catch (error: unknown) {
      this.handleError(error, "update", { id });
    }
  }
}

export const readingsApi = new ReadingsApi();
