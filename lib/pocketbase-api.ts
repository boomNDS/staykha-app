import { ofetch } from "ofetch";
import type {
  AdminInvitation,
  AdminSettings,
  Building,
  Invoice,
  MeterReadingGroup,
  Room,
  Team,
  Tenant,
  User,
} from "@/lib/types";
import type {
  BulkCreateRoomsData,
  CreateInvitationData,
  CreateReadingData,
  CreateRoomData,
  LoginResponse,
  RegisterResponse,
} from "@/types/api";
import type {
  AdminInvitationRecord,
  BuildingRecord,
  InvoiceRecord,
  ReadingGroupRecord,
  RoomRecord,
  SettingsRecord,
  TeamRecord,
  TenantRecord,
  UserRecord,
} from "@/types/collections";
import type {
  BuildingMapperInput,
  InvitationMapperInput,
  ReadingGroupMapperInput,
  SettingsMapperInput,
  TeamMapperInput,
} from "@/types/mappers";
import type {
  ListResponse,
  PocketBaseClient,
  RecordMeta,
} from "@/types/pocketbase";
import {
  mapBuildingRecord,
  mapInvitationRecord,
  mapInvoiceRecord,
  mapReadingRecord,
  mapRoomRecord,
  mapSettingsRecord,
  mapTeamRecord,
  mapTenantRecord,
  mapUserRecord,
} from "./pocketbase-mappers";

const pocketbaseUrl: string =
  import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090";

const isUniqueConstraintError = (error: unknown) => {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : (error as { message?: string })?.message;
  const raw = JSON.stringify(error ?? {});
  return (
    (message && /unique|constraint/i.test(message)) ||
    /unique|constraint/i.test(raw)
  );
};

// Helper function to get current user's teamId from localStorage
function getCurrentUserTeamId(): string {
  if (typeof window === "undefined") {
    throw new Error("ไม่สามารถเข้าถึง localStorage บนเซิร์ฟเวอร์ได้");
  }
  const userData = localStorage.getItem("user");
  if (!userData) {
    throw new Error("ยังไม่ได้ยืนยันตัวตน");
  }
  try {
    const user = JSON.parse(userData) as User;
    if (!user.teamId) {
      throw new Error("ผู้ใช้ยังไม่มี teamId กรุณาสร้างหรือเข้าร่วมทีมก่อน");
    }
    return user.teamId;
  } catch (_error) {
    throw new Error("ไม่สามารถอ่านข้อมูลผู้ใช้หรือหา teamId ได้");
  }
}

// Helper function to create a PocketBaseClient from ofetch instance
function createPocketBaseClient(
  fetchInstance: ReturnType<typeof ofetch.create>,
): PocketBaseClient {
  return {
    get: <T = unknown>(
      url: string,
      options?: { params?: Record<string, unknown> },
    ) => {
      return fetchInstance<T>(url, { method: "GET", ...options });
    },
    post: <T = unknown>(url: string, body?: unknown) => {
      return fetchInstance<T>(url, {
        method: "POST",
        body: body as Record<string, any> | BodyInit | null | undefined,
      });
    },
    patch: <T = unknown>(url: string, body?: unknown) => {
      return fetchInstance<T>(url, {
        method: "PATCH",
        body: body as Record<string, any> | BodyInit | null | undefined,
      });
    },
    delete: <T = unknown>(url: string) => {
      return fetchInstance<T>(url, { method: "DELETE" });
    },
  };
}

const pocketbaseFetch = ofetch.create({
  baseURL: `${pocketbaseUrl}/api/collections`,
  credentials: "omit",
  headers: {
    accept: "application/json",
    "content-type": "application/json",
  },
  onRequest({ options, request }) {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("token");
    if (token) {
      const existingHeaders = options.headers;
      if (existingHeaders instanceof Headers) {
        existingHeaders.set("Authorization", `Bearer ${token}`);
      } else {
        const headersObj =
          (existingHeaders as unknown as Record<string, string>) || {};
        options.headers = {
          ...headersObj,
          Authorization: `Bearer ${token}`,
        } as unknown as typeof options.headers;
      }
    }
    // Debug logging
    if (import.meta.env.DEV) {
      const url =
        typeof request === "string" ? request : request?.toString() || "";
      console.log(`[PocketBase API] ${options.method || "GET"} ${url}`, {
        body: options.body,
      });
    }
  },
  onResponseError({ response }) {
    // Debug error logging
    if (import.meta.env.DEV) {
      console.error(
        `[PocketBase API Error] ${response.status} ${response.statusText}`,
        response._data,
      );
    }
  },
});

const authFetch = ofetch.create({
  baseURL: `${pocketbaseUrl}/api`,
  credentials: "omit",
  headers: {
    accept: "application/json",
    "content-type": "application/json",
  },
  onRequest({ options, request }) {
    // Debug logging
    if (import.meta.env.DEV) {
      const url =
        typeof request === "string" ? request : (request as Request)?.url || "";
      console.log(`[PocketBase Auth] ${options.method || "POST"} ${url}`, {
        body: options.body,
      });
    }
  },
  onResponseError({ response }) {
    // Debug error logging
    if (import.meta.env.DEV) {
      console.error(
        `[PocketBase Auth Error] ${response.status} ${response.statusText}`,
        response._data,
      );
    }
  },
});

const pocketbaseClient: PocketBaseClient =
  createPocketBaseClient(pocketbaseFetch);
const authClient: PocketBaseClient = createPocketBaseClient(authFetch);

async function listRecords<T>(
  collection: string,
  params?: Record<string, unknown>,
): Promise<(T & RecordMeta)[]> {
  const response = await pocketbaseClient.get<ListResponse<T>>(
    `/${collection}/records`,
    {
      params: { perPage: 100, ...params },
    },
  );
  return response.items;
}

async function getRecord<T>(
  collection: string,
  id: string,
): Promise<T & RecordMeta> {
  const response = await pocketbaseClient.get<T & RecordMeta>(
    `/${collection}/records/${id}`,
  );
  return response;
}

async function createRecord<T>(
  collection: string,
  payload: T,
): Promise<T & RecordMeta> {
  const response = await pocketbaseClient.post<T & RecordMeta>(
    `/${collection}/records`,
    payload,
  );
  return response;
}

async function updateRecord<T>(
  collection: string,
  id: string,
  payload: Partial<T>,
): Promise<T & RecordMeta> {
  const response = await pocketbaseClient.patch<T & RecordMeta>(
    `/${collection}/records/${id}`,
    payload,
  );
  return response;
}

async function deleteRecord(
  collection: string,
  id: string,
): Promise<{ ok: boolean }> {
  return pocketbaseClient.delete<{ ok: boolean }>(
    `/${collection}/records/${id}`,
  );
}

export const teamsApi = {
  getAll: async (): Promise<{ teams: Team[] }> => {
    const items =
      await listRecords<Omit<TeamRecord, keyof RecordMeta>>("teams");
    return { teams: items.map(mapTeamRecord) };
  },
  getById: async (id: string): Promise<{ team: Team }> => {
    const record = await getRecord<Omit<TeamRecord, keyof RecordMeta>>(
      "teams",
      id,
    );
    return { team: mapTeamRecord(record) };
  },
  create: async (
    data: Omit<Team, "id" | "createdAt" | "updatedAt">,
  ): Promise<{ team: Team }> => {
    const teamName = data.name.trim();
    const existingTeams = await listRecords<
      Omit<TeamRecord, keyof RecordMeta>
    >("teams", {
      filter: `name = "${teamName}"`,
      perPage: 1,
    });
    if (existingTeams.length > 0) {
      throw new Error("ชื่อทีมนี้ถูกใช้แล้ว กรุณาใช้ชื่ออื่น");
    }
    try {
      const record = await createRecord<Omit<TeamRecord, keyof RecordMeta>>(
        "teams",
        {
          name: teamName,
        },
      );
      return { team: mapTeamRecord(record as TeamMapperInput) };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      throw new Error("ชื่อทีมนี้ถูกใช้แล้ว กรุณาใช้ชื่ออื่น");
    }
  },
  update: async (id: string, data: Partial<Team>): Promise<{ team: Team }> => {
    const record = await updateRecord<Team>("teams", id, data);
    return { team: mapTeamRecord(record) };
  },
  remove: async (id: string): Promise<{ ok: boolean }> =>
    deleteRecord("teams", id),
};

export const buildingsApi = {
  getAll: async (): Promise<{ buildings: Building[] }> => {
    const items =
      await listRecords<Omit<BuildingRecord, keyof RecordMeta>>("buildings");
    return { buildings: items.map(mapBuildingRecord) };
  },
  getById: async (id: string): Promise<{ building: Building }> => {
    const record = await getRecord<Omit<BuildingRecord, keyof RecordMeta>>(
      "buildings",
      id,
    );
    return { building: mapBuildingRecord(record) };
  },
  create: async (
    data: Omit<Building, "id" | "createdAt" | "updatedAt">,
  ): Promise<{ building: Building }> => {
    // Get teamId from user if not provided in data
    const teamId = data.teamId || getCurrentUserTeamId();
    const record = await createRecord<Omit<BuildingRecord, keyof RecordMeta>>(
      "buildings",
      {
        name: data.name,
        address: data.address,
        totalFloors: data.totalFloors ?? 1,
        totalRooms: data.totalRooms ?? 0,
        occupiedRooms: data.occupiedRooms ?? 0,
        ownerId: data.ownerId,
        teamId,
      },
    );
    return { building: mapBuildingRecord(record as BuildingMapperInput) };
  },
  update: async (
    id: string,
    data: Partial<Building>,
  ): Promise<{ building: Building }> => {
    const record = await updateRecord<Building>("buildings", id, data);
    return { building: mapBuildingRecord(record) };
  },
  remove: async (id: string): Promise<{ ok: boolean }> =>
    deleteRecord("buildings", id),
};

export const authApi = {
  login: async (
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> => {
    const response = await authClient.post<LoginResponse>(
      "/collections/users/auth-with-password",
      {
        identity: email,
        password,
      },
    );
    // Map the user record to include team info if available
    const userRecord = response.record as UserRecord;
    const user = mapUserRecord(userRecord);
    return { user, token: response.token };
  },
  register: async (
    email: string,
    password: string,
    passwordConfirm: string,
    name?: string,
    role?: "owner" | "admin",
  ): Promise<{ user: User }> => {
    const response = await authClient.post<RegisterResponse>(
      "/collections/users/records",
      {
        email,
        password,
        passwordConfirm,
        name,
        role: role || "admin",
        emailVisibility: false,
      },
    );
    const user = {
      id: response.id,
      email: response.email,
      name: response.name ?? response.email,
      role: (response.role as "owner" | "admin") ?? "admin",
    };
    return { user };
  },
  requestPasswordReset: async (email: string): Promise<unknown> => {
    return await authClient.post("/collections/users/request-password-reset", {
      email,
    });
  },
  confirmPasswordReset: async (
    token: string,
    password: string,
    passwordConfirm: string,
  ): Promise<unknown> => {
    return await authClient.post("/collections/users/confirm-password-reset", {
      token,
      password,
      passwordConfirm,
    });
  },
  verifyEmail: async (token: string): Promise<unknown> => {
    return await authClient.post("/collections/users/verify-email", { token });
  },
};

export const roomsApi = {
  getAll: async (): Promise<{ rooms: Room[] }> => {
    const items =
      await listRecords<Omit<RoomRecord, keyof RecordMeta>>("rooms");
    return { rooms: items.map(mapRoomRecord) };
  },
  getById: async (id: string): Promise<{ room: Room }> => {
    const record = await getRecord<Omit<RoomRecord, keyof RecordMeta>>(
      "rooms",
      id,
    );
    return { room: mapRoomRecord(record) };
  },
  create: async (data: CreateRoomData): Promise<{ room: Room }> => {
    const teamId = getCurrentUserTeamId();
    const existingRooms = await listRecords<
      Omit<RoomRecord, keyof RecordMeta>
    >("rooms", {
      filter: `teamId = "${teamId}" && buildingId = "${data.buildingId}" && roomNumber = "${data.roomNumber}"`,
      perPage: 1,
    });
    if (existingRooms.length > 0) {
      throw new Error("มีเลขห้องนี้ในอาคารแล้ว กรุณาใช้เลขห้องอื่น");
    }
    try {
      const record = await createRecord("rooms", {
        ...data,
        teamId,
      });
      return { room: mapRoomRecord(record) };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      const existingAfterError = await listRecords<
        Omit<RoomRecord, keyof RecordMeta>
      >("rooms", {
        filter: `teamId = "${teamId}" && buildingId = "${data.buildingId}" && roomNumber = "${data.roomNumber}"`,
        perPage: 1,
      });
      if (existingAfterError.length === 0) {
        throw error;
      }
      return { room: mapRoomRecord(existingAfterError[0]) };
    }
  },
  update: async (
    id: string,
    data: Partial<Omit<Room, "id">>,
  ): Promise<{ room: Room }> => {
    const record = await updateRecord("rooms", id, data);
    return { room: mapRoomRecord(record) };
  },
  remove: async (id: string): Promise<{ ok: boolean }> =>
    deleteRecord("rooms", id),
  bulkCreate: async (
    data: BulkCreateRoomsData,
  ): Promise<{
    createdCount: number;
    skippedRooms: string[];
    rooms: Room[];
  }> => {
    const teamId = getCurrentUserTeamId();
    const created: Room[] = [];
    const skippedRooms: string[] = [];
    const existingRooms = await listRecords<
      Omit<RoomRecord, keyof RecordMeta>
    >("rooms", {
      filter: `teamId = "${teamId}" && buildingId = "${data.buildingId}"`,
      perPage: 200,
    });
    const existingRoomNumbers = new Set(
      existingRooms.map((room) => room.roomNumber),
    );
    for (let floor = data.floorStart; floor <= data.floorEnd; floor += 1) {
      for (let offset = 0; offset < data.roomsPerFloor; offset += 1) {
        const roomNumber = `${floor}${String(data.startIndex + offset).padStart(2, "0")}`;
        if (existingRoomNumbers.has(roomNumber)) {
          skippedRooms.push(roomNumber);
          continue;
        }
        try {
          const record = await createRecord("rooms", {
            roomNumber,
            buildingId: data.buildingId,
            floor,
            status: data.status,
            monthlyRent: data.monthlyRent,
            size: data.size,
            teamId,
          });
          created.push(mapRoomRecord(record));
          existingRoomNumbers.add(roomNumber);
        } catch (error) {
          if (!isUniqueConstraintError(error)) {
            throw error;
          }
          skippedRooms.push(roomNumber);
        }
      }
    }
    return { createdCount: created.length, skippedRooms, rooms: created };
  },
};

export const tenantsApi = {
  getAll: async (): Promise<{ tenants: Tenant[] }> => {
    const items =
      await listRecords<Omit<TenantRecord, keyof RecordMeta>>("tenants");
    return { tenants: items.map(mapTenantRecord) };
  },
  create: async (data: Omit<Tenant, "id">): Promise<{ tenant: Tenant }> => {
    const teamId = getCurrentUserTeamId();
    const record = await createRecord("tenants", {
      ...data,
      teamId,
    });
    return { tenant: mapTenantRecord(record) };
  },
  update: async (
    id: string,
    updates: Partial<Tenant>,
  ): Promise<{ tenant: Tenant }> => {
    const record = await updateRecord("tenants", id, updates);
    return { tenant: mapTenantRecord(record) };
  },
  remove: async (id: string): Promise<{ ok: boolean }> =>
    deleteRecord("tenants", id),
};

const normalizeReadingDate = (value: string) => {
  const directMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (directMatch) {
    return directMatch[0];
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return value;
};

export const readingsApi = {
  getAll: async (): Promise<{ readings: MeterReadingGroup[] }> => {
    const items =
      await listRecords<Omit<ReadingGroupRecord, keyof RecordMeta>>(
        "reading_groups",
      );
    return { readings: items.map(mapReadingRecord) };
  },
  getById: async (id: string): Promise<{ reading: MeterReadingGroup }> => {
    const record = await getRecord<Omit<ReadingGroupRecord, keyof RecordMeta>>(
      "reading_groups",
      id,
    );
    return { reading: mapReadingRecord(record as ReadingGroupMapperInput) };
  },
  getByRoomDate: async (
    roomId: string,
    readingDate: string,
  ): Promise<{ reading: MeterReadingGroup | null }> => {
    const teamId = getCurrentUserTeamId();
    const normalizedDate = normalizeReadingDate(readingDate);
    const items = await listRecords<
      Omit<ReadingGroupRecord, keyof RecordMeta>
    >("reading_groups", {
      filter: `teamId = "${teamId}" && roomId = "${roomId}" && readingDate = "${normalizedDate}"`,
      perPage: 1,
    });
    if (!items.length) {
      return { reading: null };
    }
    return {
      reading: mapReadingRecord(items[0] as ReadingGroupMapperInput),
    };
  },
  create: async (
    data: CreateReadingData,
  ): Promise<{ reading: MeterReadingGroup }> => {
    const teamId = getCurrentUserTeamId();
    const readingDate = normalizeReadingDate(data.readingDate);
    if (!data.water && !data.electric) {
      throw new Error("ต้องมีการอ่านมิเตอร์อย่างน้อย 1 รายการ");
    }

    const settingsItems = await listRecords<
      Omit<SettingsRecord, keyof RecordMeta>
    >("settings", {
      filter: `teamId = "${teamId}"`,
      perPage: 1,
    });
    const requiresWater =
      settingsItems.length > 0
        ? mapSettingsRecord(settingsItems[0] as SettingsMapperInput)
            .waterBillingMode !== "fixed"
        : true;

    const resolveStatus = (hasWater: boolean, hasElectric: boolean) =>
      hasElectric && (!requiresWater || hasWater)
        ? ("pending" as MeterReadingGroup["status"])
        : ("incomplete" as MeterReadingGroup["status"]);

    const existingGroups = await listRecords<
      Omit<ReadingGroupRecord, keyof RecordMeta>
    >("reading_groups", {
      filter: `teamId = "${teamId}" && roomId = "${data.roomId}" && readingDate = "${readingDate}"`,
      perPage: 1,
    });

    if (existingGroups.length > 0) {
      const existingGroup = existingGroups[0];
      const mergedWater =
        data.water ??
        (existingGroup.water as Record<string, unknown> | undefined);
      const mergedElectric =
        data.electric ??
        (existingGroup.electric as Record<string, unknown> | undefined);
      const status = resolveStatus(Boolean(mergedWater), Boolean(mergedElectric));

      const updatedRecord = await updateRecord<
        Partial<Omit<ReadingGroupRecord, keyof RecordMeta>>
      >("reading_groups", existingGroup.id, {
        water: mergedWater,
        electric: mergedElectric,
        status,
      });

      const mergedRecord = {
        ...existingGroup,
        ...updatedRecord,
        water: (updatedRecord.water ?? mergedWater) as
          | Record<string, unknown>
          | undefined,
        electric: (updatedRecord.electric ?? mergedElectric) as
          | Record<string, unknown>
          | undefined,
      };

      return {
        reading: mapReadingRecord(mergedRecord as ReadingGroupMapperInput),
      };
    }

    const status = resolveStatus(Boolean(data.water), Boolean(data.electric));
    try {
      const record = await createRecord<
        Omit<ReadingGroupRecord, keyof RecordMeta> & {
          status: MeterReadingGroup["status"];
        }
      >("reading_groups", {
        ...data,
        readingDate,
        status,
        teamId,
      });
      return { reading: mapReadingRecord(record as ReadingGroupMapperInput) };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existingAfterError = await listRecords<
        Omit<ReadingGroupRecord, keyof RecordMeta>
      >("reading_groups", {
        filter: `teamId = "${teamId}" && roomId = "${data.roomId}" && readingDate = "${readingDate}"`,
        perPage: 1,
      });
      if (existingAfterError.length === 0) {
        throw error;
      }

      const existingGroup = existingAfterError[0];
      const mergedWater =
        data.water ??
        (existingGroup.water as Record<string, unknown> | undefined);
      const mergedElectric =
        data.electric ??
        (existingGroup.electric as Record<string, unknown> | undefined);
      const mergedStatus = resolveStatus(
        Boolean(mergedWater),
        Boolean(mergedElectric),
      );

      const updatedRecord = await updateRecord<
        Partial<Omit<ReadingGroupRecord, keyof RecordMeta>>
      >("reading_groups", existingGroup.id, {
        water: mergedWater,
        electric: mergedElectric,
        status: mergedStatus,
      });

      const mergedRecord = {
        ...existingGroup,
        ...updatedRecord,
        water: (updatedRecord.water ?? mergedWater) as
          | Record<string, unknown>
          | undefined,
        electric: (updatedRecord.electric ?? mergedElectric) as
          | Record<string, unknown>
          | undefined,
      };

      return {
        reading: mapReadingRecord(mergedRecord as ReadingGroupMapperInput),
      };
    }
  },
  update: async (
    id: string,
    updates: Partial<MeterReadingGroup>,
  ): Promise<{ reading: MeterReadingGroup }> => {
    const existingRecord = await getRecord<
      Omit<ReadingGroupRecord, keyof RecordMeta>
    >("reading_groups", id);
    const record = await updateRecord<
      Partial<Omit<ReadingGroupRecord, keyof RecordMeta>>
    >("reading_groups", id, {
      ...updates,
      water: updates.water as Record<string, unknown> | undefined,
      electric: updates.electric as Record<string, unknown> | undefined,
    });
    const mergedRecord = {
      ...existingRecord,
      ...record,
      water: (record.water ?? existingRecord.water) as
        | Record<string, unknown>
        | undefined,
      electric: (record.electric ?? existingRecord.electric) as
        | Record<string, unknown>
        | undefined,
    };
    return {
      reading: mapReadingRecord(mergedRecord as ReadingGroupMapperInput),
    };
  },
};

export const invoicesApi = {
  getAll: async (): Promise<{ invoices: Invoice[] }> => {
    const items =
      await listRecords<Omit<InvoiceRecord, keyof RecordMeta>>("invoices");
    return { invoices: items.map(mapInvoiceRecord) };
  },
  getById: async (id: string): Promise<{ invoice: Invoice }> => {
    const record = await getRecord<Omit<InvoiceRecord, keyof RecordMeta>>(
      "invoices",
      id,
    );
    return { invoice: mapInvoiceRecord(record) };
  },
  update: async (
    id: string,
    updates: Partial<Invoice>,
  ): Promise<{ invoice: Invoice }> => {
    const record = await updateRecord("invoices", id, updates);
    return { invoice: mapInvoiceRecord(record) };
  },
  downloadPdf: async (_id: string): Promise<Blob> => {
    // PDF generation is handled client-side using jsPDF and html-to-image
    // This function is kept for API compatibility but should not be called directly
    // Use client-side PDF generation in components instead
    throw new Error(
      "PDF download should be handled client-side. Use jsPDF and html-to-image in the component.",
    );
  },
  generateFromReadingGroup: async (
    readingGroupId: string,
  ): Promise<{ invoice: Invoice }> => {
    const teamId = getCurrentUserTeamId();

    // Check if an invoice already exists for this reading group
    const existingInvoicesForGroup = await listRecords<
      Omit<InvoiceRecord, keyof RecordMeta>
    >("invoices", {
      filter: `readingGroupId = "${readingGroupId}"`,
    });

    if (existingInvoicesForGroup.length > 0) {
      throw new Error("มีใบแจ้งหนี้สำหรับกลุ่มการอ่านนี้แล้ว (แต่ละกลุ่มสร้างได้เพียง 1 ใบ)");
    }

    // Get the reading group
    const readingGroup = await getRecord<
      Omit<ReadingGroupRecord, keyof RecordMeta>
    >("reading_groups", readingGroupId);

    if (!readingGroup.electric) {
      throw new Error("ต้องมีการอ่านมิเตอร์ไฟก่อนจึงจะสร้างใบแจ้งหนี้ได้");
    }

    // Get settings for the team
    const settingsItems = await listRecords<
      Omit<SettingsRecord, keyof RecordMeta>
    >("settings", {
      filter: `teamId = "${teamId}"`,
    });
    if (settingsItems.length === 0) {
      throw new Error(`ไม่พบ Settings ของทีม ${teamId}`);
    }
    const settings = mapSettingsRecord(settingsItems[0] as SettingsMapperInput);

    // Check water reading requirement
    if (settings.waterBillingMode !== "fixed" && !readingGroup.water) {
      throw new Error("กรุณากรอกการอ่านมิเตอร์น้ำและไฟให้ครบก่อนสร้างใบแจ้งหนี้");
    }

    // Get room and tenant info
    const room = await getRecord<Omit<RoomRecord, keyof RecordMeta>>(
      "rooms",
      readingGroup.roomId,
    );
    const tenant = room.tenantId
      ? await getRecord<Omit<TenantRecord, keyof RecordMeta>>(
          "tenants",
          room.tenantId,
        ).catch(() => null)
      : null;

    // Calculate dates
    const issueDate = new Date(readingGroup.readingDate);
    const dueDate = new Date(issueDate);

    // Use dueDateDayOfMonth if set, otherwise use paymentTermsDays
    if (
      settings.dueDateDayOfMonth &&
      settings.dueDateDayOfMonth >= 1 &&
      settings.dueDateDayOfMonth <= 31
    ) {
      // Set due date to the specified day of the month
      dueDate.setDate(settings.dueDateDayOfMonth);
      // If the due date is in the past for this month, move to next month
      if (dueDate < issueDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
    } else {
      // Fallback to paymentTermsDays
      dueDate.setDate(dueDate.getDate() + settings.paymentTermsDays);
    }

    // Extract reading values from reading group
    const waterReading = readingGroup.water as
      | {
          previousReading?: number;
          currentReading?: number;
          consumption?: number;
          previousPhotoUrl?: string;
          currentPhotoUrl?: string;
        }
      | undefined;
    const electricReading = readingGroup.electric as
      | {
          previousReading?: number;
          currentReading?: number;
          consumption?: number;
          previousPhotoUrl?: string;
          currentPhotoUrl?: string;
        }
      | undefined;

    // Calculate amounts
    const waterConsumption = waterReading?.consumption ?? 0;
    const electricConsumption = electricReading?.consumption ?? 0;

    const waterAmount =
      settings.waterBillingMode === "fixed"
        ? (settings.waterFixedFee ?? 0)
        : waterConsumption * settings.waterRatePerUnit;
    const electricAmount = electricConsumption * settings.electricRatePerUnit;
    const subtotal = waterAmount + electricAmount;
    const tax = subtotal * (settings.taxRate / 100);
    const total = subtotal + tax;

    // Generate invoice number - get existing invoices count
    const existingInvoices = await listRecords<
      Omit<InvoiceRecord, keyof RecordMeta>
    >("invoices", {
      filter: `teamId = "${teamId}"`,
    });
    const invoiceNumber = `${settings.invoicePrefix}-${issueDate.getFullYear()}-${String(existingInvoices.length + 1).padStart(3, "0")}`;

    // Prepare readings data for invoice
    const invoiceReadings = [];
    if (waterReading && settings.waterBillingMode !== "fixed") {
      invoiceReadings.push({
        meterType: "water",
        previousReading: waterReading.previousReading ?? 0,
        currentReading: waterReading.currentReading ?? 0,
        consumption: waterReading.consumption ?? 0,
        previousPhotoUrl: waterReading.previousPhotoUrl ?? "",
        currentPhotoUrl: waterReading.currentPhotoUrl ?? "",
      });
    }
    if (electricReading) {
      invoiceReadings.push({
        meterType: "electric",
        previousReading: electricReading.previousReading ?? 0,
        currentReading: electricReading.currentReading ?? 0,
        consumption: electricReading.consumption ?? 0,
        previousPhotoUrl: electricReading.previousPhotoUrl ?? "",
        currentPhotoUrl: electricReading.currentPhotoUrl ?? "",
      });
    }

    // Create invoice
    let invoiceRecord: Omit<InvoiceRecord, keyof RecordMeta> & RecordMeta;
    try {
      invoiceRecord = await createRecord<
        Omit<InvoiceRecord, keyof RecordMeta>
      >("invoices", {
        invoiceNumber,
        tenantId: tenant?.id,
        roomId: readingGroup.roomId,
        tenantName: tenant?.name ?? readingGroup.tenantName,
        roomNumber: room.roomNumber ?? readingGroup.roomNumber,
        billingPeriod: issueDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: "pending" as Invoice["status"],
        waterUsage: settings.waterBillingMode === "fixed" ? 0 : waterConsumption,
        waterRate:
          settings.waterBillingMode === "fixed" ? 0 : settings.waterRatePerUnit,
        waterAmount,
        electricUsage: electricConsumption,
        electricRate: settings.electricRatePerUnit,
        electricAmount,
        subtotal,
        tax,
        total,
        waterConsumption:
          settings.waterBillingMode === "fixed" ? undefined : waterConsumption,
        electricConsumption,
        waterRatePerUnit: settings.waterRatePerUnit,
        electricRatePerUnit: settings.electricRatePerUnit,
        waterSubtotal: waterAmount,
        electricSubtotal: electricAmount,
        waterBillingMode: settings.waterBillingMode,
        waterFixedFee: settings.waterFixedFee,
        readingGroupId,
        readings: invoiceReadings.length > 0 ? invoiceReadings : undefined,
        teamId,
      } as Omit<InvoiceRecord, keyof RecordMeta>);
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      const existingForGroup = await listRecords<
        Omit<InvoiceRecord, keyof RecordMeta>
      >("invoices", {
        filter: `readingGroupId = "${readingGroupId}"`,
        perPage: 1,
      });
      if (existingForGroup.length === 0) {
        throw error;
      }
      return { invoice: mapInvoiceRecord(existingForGroup[0]) };
    }

    // Update reading group status to "billed"
    await updateRecord<Partial<Omit<ReadingGroupRecord, keyof RecordMeta>>>(
      "reading_groups",
      readingGroupId,
      {
        status: "billed" as MeterReadingGroup["status"],
      },
    );

    return { invoice: mapInvoiceRecord(invoiceRecord) };
  },
};

export const settingsApi = {
  get: async (
    teamId: string,
  ): Promise<{ settings: (AdminSettings & RecordMeta) | null }> => {
    const items = await listRecords<Omit<SettingsRecord, keyof RecordMeta>>(
      "settings",
      {
        filter: `teamId = "${teamId}"`,
      },
    );
    // Return null if settings don't exist (instead of creating automatically)
    if (items.length === 0) {
      return { settings: null };
    }
    return { settings: mapSettingsRecord(items[0] as SettingsMapperInput) };
  },
  update: async (
    teamId: string,
    updates: Partial<AdminSettings>,
  ): Promise<{ settings: AdminSettings & RecordMeta }> => {
    // Check if settings exist
    const items = await listRecords<Omit<SettingsRecord, keyof RecordMeta>>(
      "settings",
      {
        filter: `teamId = "${teamId}"`,
      },
    );

    // If settings don't exist, create them with the provided updates
    if (items.length === 0) {
      // Filter out fields that shouldn't be created (team relation, etc.)
      const { team, teamId: _teamId, ...createPayload } = updates;

      // Remove undefined values
      const cleanPayload = Object.fromEntries(
        Object.entries(createPayload).filter(
          ([_, value]) => value !== undefined,
        ),
      ) as Partial<Omit<SettingsRecord, keyof RecordMeta>>;

      // Create with defaults for required fields if not provided
      try {
        const newRecord = await createRecord<
          Omit<SettingsRecord, keyof RecordMeta>
        >("settings", {
          teamId,
          waterRatePerUnit: cleanPayload.waterRatePerUnit ?? 25,
          waterBillingMode: cleanPayload.waterBillingMode ?? "metered",
          waterFixedFee: cleanPayload.waterFixedFee ?? 0,
          electricRatePerUnit: cleanPayload.electricRatePerUnit ?? 4.5,
          taxRate: cleanPayload.taxRate ?? 7,
          currency: cleanPayload.currency ?? "THB",
          companyName: cleanPayload.companyName ?? "StayKha",
          companyAddress: cleanPayload.companyAddress ?? "",
          companyPhone: cleanPayload.companyPhone ?? "",
          companyEmail: cleanPayload.companyEmail ?? "",
          invoicePrefix: cleanPayload.invoicePrefix ?? "INV",
          paymentTermsDays: cleanPayload.paymentTermsDays ?? 15,
          defaultRoomRent: cleanPayload.defaultRoomRent ?? 4500,
          defaultRoomSize: cleanPayload.defaultRoomSize ?? 28,
          latePaymentPenaltyPerDay: cleanPayload.latePaymentPenaltyPerDay ?? 0,
          dueDateDayOfMonth: cleanPayload.dueDateDayOfMonth ?? 5,
          labelInvoice: cleanPayload.labelInvoice ?? "ใบแจ้งหนี้",
          labelRoomRent: cleanPayload.labelRoomRent ?? "ค่าเช่าห้อง",
          labelWater: cleanPayload.labelWater ?? "ค่าน้ำประปา",
          labelElectricity: cleanPayload.labelElectricity ?? "ค่าไฟฟ้า",
          ...cleanPayload,
        });
        return { settings: mapSettingsRecord(newRecord as SettingsMapperInput) };
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
        const existingAfterError = await listRecords<
          Omit<SettingsRecord, keyof RecordMeta>
        >("settings", {
          filter: `teamId = "${teamId}"`,
          perPage: 1,
        });
        if (existingAfterError.length === 0) {
          throw error;
        }
        const updated = await updateRecord(
          "settings",
          existingAfterError[0].id,
          cleanPayload,
        );
        return { settings: mapSettingsRecord(updated as SettingsMapperInput) };
      }
    }

    // Settings exist, update them
    const target = items[0];

    // Filter out fields that shouldn't be updated (team relation, etc.)
    const { team, teamId: _teamId, ...updatePayload } = updates;

    // Remove undefined values to avoid sending them to PocketBase
    const cleanPayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([_, value]) => value !== undefined),
    ) as Partial<Omit<SettingsRecord, keyof RecordMeta>>;

    const updated = await updateRecord("settings", target.id, cleanPayload);
    return { settings: mapSettingsRecord(updated as SettingsMapperInput) };
  },
  create: async (
    teamId: string,
    data: Omit<AdminSettings, "teamId">,
  ): Promise<{ settings: AdminSettings & RecordMeta }> => {
    const record = await createRecord<Omit<SettingsRecord, keyof RecordMeta>>(
      "settings",
      {
        teamId,
        ...data,
      },
    );
    return { settings: mapSettingsRecord(record as SettingsMapperInput) };
  },
};

export const adminsApi = {
  getAll: async (teamId?: string): Promise<{ admins: User[] }> => {
    const filterParts: string[] = ['(role = "admin" || role = "owner")'];
    if (teamId) {
      filterParts.unshift(`teamId = "${teamId}"`);
    }
    const items = await listRecords<Omit<UserRecord, keyof RecordMeta>>(
      "users",
      {
        filter: filterParts.join(" && "),
      },
    );
    return { admins: items.map(mapUserRecord) };
  },
  remove: async (id: string): Promise<{ ok: boolean }> =>
    deleteRecord("users", id),
};

export const invitationsApi = {
  getAll: async (
    teamId?: string,
  ): Promise<{ invitations: AdminInvitation[] }> => {
    const filter = teamId ? `teamId = "${teamId}"` : undefined;
    const items = await listRecords<
      Omit<AdminInvitationRecord, keyof RecordMeta>
    >("admin_invitations", filter ? { filter } : undefined);
    return { invitations: items.map(mapInvitationRecord) };
  },
  create: async (
    data: CreateInvitationData & { teamId: string },
  ): Promise<{ invitation: AdminInvitation }> => {
    const status: AdminInvitation["status"] = "pending";
    const record = await createRecord<
      Omit<AdminInvitationRecord, keyof RecordMeta> & { message?: string }
    >("admin_invitations", {
      email: data.email,
      teamId: data.teamId,
      invitedBy: "owner",
      invitedByName: data.name,
      status,
      inviteCode: `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: data.message,
    });
    return { invitation: mapInvitationRecord(record as InvitationMapperInput) };
  },
  acceptByCode: async (
    inviteCode: string,
    userId: string,
  ): Promise<{ invitation: AdminInvitation; team: Team }> => {
    // Find invitation by code
    const items = await listRecords<
      Omit<AdminInvitationRecord, keyof RecordMeta>
    >("admin_invitations", {
      filter: `inviteCode = "${inviteCode}" && status = "pending"`,
    });
    if (items.length === 0) {
      throw new Error("โค้ดคำเชิญไม่ถูกต้องหรือหมดอายุ");
    }
    const invitation = items[0] as AdminInvitationRecord;

    // Check if expired
    if (new Date(invitation.expiresAt) < new Date()) {
      throw new Error("โค้ดคำเชิญหมดอายุแล้ว");
    }

    // Update invitation status
    const updatedInvitation = await updateRecord<
      Partial<AdminInvitationRecord>
    >("admin_invitations", invitation.id, {
      status: "accepted",
    });

    // Update user with teamId
    await updateRecord<Partial<UserRecord>>("users", userId, {
      teamId: invitation.teamId,
    });

    // Get team info
    const team = await getRecord<Omit<TeamRecord, keyof RecordMeta>>(
      "teams",
      invitation.teamId,
    );

    return {
      invitation: mapInvitationRecord(
        updatedInvitation as InvitationMapperInput,
      ),
      team: mapTeamRecord(team),
    };
  },
  remove: async (id: string): Promise<{ ok: boolean }> =>
    deleteRecord("admin_invitations", id),
};
