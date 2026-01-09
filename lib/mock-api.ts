import {
  mockBuildings,
  mockInvitations,
  mockInvoices,
  mockReadings,
  mockRooms,
  mockTenants,
  mockUsers,
} from "./mock-data";
import type {
  AdminInvitation,
  AdminSettings,
  Building,
  Invoice,
  MeterReading,
  MeterReadingGroup,
  Room,
  Tenant,
} from "./types";

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

let settings: AdminSettings = {
  waterRatePerUnit: 25,
  waterBillingMode: "metered",
  waterFixedFee: 0,
  electricRatePerUnit: 4.5,
  taxRate: 7,
  currency: "THB",
  companyName: "StayKha",
  companyAddress: "123 Campus Drive, University City, UC 12345",
  companyPhone: "+66-2-123-4567",
  companyEmail: "billing@dormitory.edu",
  invoicePrefix: "INV",
  paymentTermsDays: 15,
  defaultRoomRent: 4500,
  defaultRoomSize: 28,
};

const findBuildingName = (buildingId: string) =>
  mockBuildings.find((b) => b.id === buildingId)?.name;

const groupReadings = () => {
  const groups = mockReadings.reduce<Record<string, MeterReadingGroup>>(
    (acc, reading) => {
      const key = `${reading.roomId}-${reading.readingDate}`;
      if (!acc[key]) {
        acc[key] = {
          id: key,
          roomId: reading.roomId,
          roomNumber: reading.roomNumber,
          tenantName: reading.tenantName,
          readingDate: reading.readingDate,
          status: "pending",
          water: undefined,
          electric: undefined,
        };
      }
      if (reading.meterType === "water") {
        acc[key].water = reading;
      } else {
        acc[key].electric = reading;
      }
      const requiresWater = settings.waterBillingMode !== "fixed";
      if (
        (!acc[key].electric || (requiresWater && !acc[key].water)) &&
        acc[key].electric
      ) {
        acc[key].status = "incomplete";
      } else if (!acc[key].electric) {
        acc[key].status = "incomplete";
      } else {
        const statuses = [
          acc[key].water?.status,
          acc[key].electric?.status,
        ].filter(Boolean) as string[];
        acc[key].status = statuses.includes("pending")
          ? "pending"
          : statuses.includes("billed")
            ? "billed"
            : "paid";
      }
      acc[key].roomNumber =
        acc[key].water?.roomNumber || acc[key].electric?.roomNumber;
      acc[key].tenantName =
        acc[key].water?.tenantName || acc[key].electric?.tenantName;
      return acc;
    },
    {},
  );

  return Object.values(groups);
};

export const authApi = {
  login: async (email: string, password: string) => {
    await delay();
    const user = mockUsers.find((u) => u.email === email);

    if (!user || !["password123", "owner123", "admin123"].includes(password)) {
      throw new Error("Invalid credentials");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: `mock-jwt-token-${Date.now()}`,
    };
  },
};

export const roomsApi = {
  getAll: async () => {
    await delay();
    return { rooms: mockRooms };
  },
  getById: async (id: string) => {
    await delay();
    const room = mockRooms.find((r) => r.id === id);
    if (!room) {
      throw new Error("Room not found");
    }
    return { room };
  },
  create: async (data: Omit<Room, "id">) => {
    await delay();
    const room: Room = {
      ...data,
      id: `room-${Date.now()}`,
      buildingName: findBuildingName(data.buildingId),
    };
    mockRooms.push(room);
    return { room };
  },
  update: async (id: string, data: Partial<Room>) => {
    await delay();
    const index = mockRooms.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error("Room not found");
    }
    const updated = {
      ...mockRooms[index],
      ...data,
    };
    if (updated.buildingId) {
      updated.buildingName = findBuildingName(updated.buildingId);
    }
    mockRooms[index] = updated;
    return { room: updated };
  },
  bulkCreate: async (data: {
    buildingId: string;
    floorStart: number;
    floorEnd: number;
    roomsPerFloor: number;
    startIndex: number;
    status: "occupied" | "vacant" | "maintenance";
    monthlyRent?: number;
    size?: number;
  }) => {
    await delay();
    const createdRooms: Room[] = [];
    const skippedRooms: string[] = [];
    const buildingName = findBuildingName(data.buildingId);

    for (let floor = data.floorStart; floor <= data.floorEnd; floor += 1) {
      for (let offset = 0; offset < data.roomsPerFloor; offset += 1) {
        const roomNumber = `${floor}${String(data.startIndex + offset).padStart(2, "0")}`;
        const exists = mockRooms.some(
          (room) =>
            room.buildingId === data.buildingId &&
            room.roomNumber === roomNumber,
        );
        if (exists) {
          skippedRooms.push(roomNumber);
          continue;
        }
        const room: Room = {
          id: `room-${Date.now()}-${floor}-${offset}`,
          roomNumber,
          buildingId: data.buildingId,
          buildingName,
          floor,
          status: data.status,
          size: data.size,
          monthlyRent: data.monthlyRent,
          tenantId: null,
        };
        createdRooms.push(room);
      }
    }

    mockRooms.push(...createdRooms);
    return {
      createdCount: createdRooms.length,
      skippedRooms,
      rooms: createdRooms,
    };
  },
  remove: async (id: string) => {
    await delay();
    const index = mockRooms.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error("Room not found");
    }
    const room = mockRooms[index];
    mockRooms.splice(index, 1);

    if (room.tenantId) {
      const tenant = mockTenants.find((t) => t.id === room.tenantId);
      if (tenant) {
        tenant.roomId = "";
      }
    }

    return { success: true };
  },
};

export const tenantsApi = {
  getAll: async () => {
    await delay();
    return { tenants: mockTenants };
  },
  getById: async (id: string) => {
    await delay();
    const tenant = mockTenants.find((t) => t.id === id);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    return { tenant };
  },
  create: async (data: Omit<Tenant, "id">) => {
    await delay();
    const tenant: Tenant = {
      ...data,
      id: `tenant-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockTenants.push(tenant);

    if (tenant.roomId) {
      const room = mockRooms.find((r) => r.id === tenant.roomId);
      if (room) {
        room.status = "occupied";
        room.tenantId = tenant.id;
      }
    }

    return { tenant };
  },
  update: async (id: string, updates: Partial<Tenant>) => {
    await delay();
    const index = mockTenants.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error("Tenant not found");
    }

    const previous = mockTenants[index];

    if (previous.roomId && previous.roomId !== updates.roomId) {
      const oldRoom = mockRooms.find((r) => r.id === previous.roomId);
      if (oldRoom) {
        oldRoom.status = "vacant";
        oldRoom.tenantId = null;
      }
    }

    if (updates.roomId && updates.roomId !== previous.roomId) {
      const newRoom = mockRooms.find((r) => r.id === updates.roomId);
      if (newRoom) {
        newRoom.status = "occupied";
        newRoom.tenantId = id;
      }
    }

    const updated = {
      ...previous,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockTenants[index] = updated;
    return { tenant: updated };
  },
  remove: async (id: string) => {
    await delay();
    const index = mockTenants.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error("Tenant not found");
    }
    const tenant = mockTenants[index];
    if (tenant.roomId) {
      const room = mockRooms.find((r) => r.id === tenant.roomId);
      if (room) {
        room.status = "vacant";
        room.tenantId = null;
      }
    }
    mockTenants.splice(index, 1);
    return { success: true };
  },
};

export const buildingsApi = {
  getAll: async () => {
    await delay();
    return { buildings: mockBuildings };
  },
  getById: async (id: string) => {
    await delay();
    const building = mockBuildings.find((b) => b.id === id);
    if (!building) {
      throw new Error("Building not found");
    }
    return { building };
  },
  create: async (data: Omit<Building, "id" | "createdAt" | "updatedAt">) => {
    await delay();
    const building: Building = {
      ...data,
      id: `bld-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockBuildings.push(building);
    return { building };
  },
  update: async (id: string, updates: Partial<Building>) => {
    await delay();
    const index = mockBuildings.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error("Building not found");
    }
    const updated = {
      ...mockBuildings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    mockBuildings[index] = updated;

    mockRooms.forEach((room) => {
      if (room.buildingId === updated.id) {
        room.buildingName = updated.name;
      }
    });

    return { building: updated };
  },
  remove: async (id: string) => {
    await delay();
    const index = mockBuildings.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error("Building not found");
    }
    mockBuildings.splice(index, 1);
    return { success: true };
  },
};

export const readingsApi = {
  getAll: async () => {
    await delay();
    return { readings: groupReadings() };
  },
  getById: async (id: string) => {
    await delay();
    const group = groupReadings().find((item) => item.id === id);
    if (!group) {
      throw new Error("Reading group not found");
    }
    return { reading: group };
  },
  create: async (data: {
    roomId: string;
    readingDate: string;
    water?: {
      previousReading: number;
      currentReading: number;
      consumption: number;
      previousPhotoUrl: string;
      currentPhotoUrl: string;
    };
    electric?: {
      previousReading: number;
      currentReading: number;
      consumption: number;
      previousPhotoUrl: string;
      currentPhotoUrl: string;
    };
  }) => {
    await delay();
    if (!data.water && !data.electric) {
      throw new Error("At least one meter reading is required.");
    }

    const room = mockRooms.find((item) => item.id === data.roomId);
    const tenant = mockTenants.find((item) => item.roomId === data.roomId);
    const base = {
      roomId: data.roomId,
      roomNumber: room?.roomNumber,
      tenantName: tenant?.name,
      readingDate: data.readingDate,
      status: "pending" as const,
    };

    const upsertReading = (reading: MeterReading) => {
      const index = mockReadings.findIndex(
        (item) =>
          item.roomId === reading.roomId &&
          item.readingDate === reading.readingDate &&
          item.meterType === reading.meterType,
      );
      if (index === -1) {
        mockReadings.push(reading);
      } else {
        mockReadings[index] = {
          ...mockReadings[index],
          ...reading,
          id: mockReadings[index].id,
        };
      }
    };

    if (data.water) {
      upsertReading({
        ...base,
        id: `reading-${Date.now()}-water`,
        meterType: "water",
        previousReading: data.water.previousReading,
        currentReading: data.water.currentReading,
        consumption: data.water.consumption,
        previousPhotoUrl: data.water.previousPhotoUrl,
        currentPhotoUrl: data.water.currentPhotoUrl,
      });
    }

    if (data.electric) {
      upsertReading({
        ...base,
        id: `reading-${Date.now()}-electric`,
        meterType: "electric",
        previousReading: data.electric.previousReading,
        currentReading: data.electric.currentReading,
        consumption: data.electric.consumption,
        previousPhotoUrl: data.electric.previousPhotoUrl,
        currentPhotoUrl: data.electric.currentPhotoUrl,
      });
    }

    return {
      reading: groupReadings().find(
        (item) => item.id === `${data.roomId}-${data.readingDate}`,
      ),
    };
  },
  update: async (id: string, updates: Partial<MeterReading>) => {
    await delay();
    const index = mockReadings.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error("Reading not found");
    }
    const updated = {
      ...mockReadings[index],
      ...updates,
    };
    mockReadings[index] = updated;
    return { reading: updated };
  },
};

export const invoicesApi = {
  getAll: async () => {
    await delay();
    return { invoices: mockInvoices };
  },
  getById: async (id: string) => {
    await delay();
    const invoice = mockInvoices.find((inv) => inv.id === id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return { invoice };
  },
  update: async (id: string, updates: Partial<Invoice>) => {
    await delay();
    const index = mockInvoices.findIndex((inv) => inv.id === id);
    if (index === -1) {
      throw new Error("Invoice not found");
    }
    const updated = { ...mockInvoices[index], ...updates };
    mockInvoices[index] = updated;
    return { invoice: updated };
  },
  downloadPdf: async (id: string) => {
    await delay();
    const invoice = mockInvoices.find((inv) => inv.id === id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return new Blob([`Invoice ${invoice.id}`], { type: "application/pdf" });
  },
  generateFromReadingGroup: async (readingGroupId: string) => {
    await delay();
    const group = groupReadings().find((item) => item.id === readingGroupId);
    if (!group) {
      throw new Error("Reading group not found");
    }
    if (!group.electric) {
      throw new Error(
        "Electric reading is required before generating an invoice.",
      );
    }
    if (settings.waterBillingMode !== "fixed" && !group.water) {
      throw new Error(
        "Complete both water and electric readings before generating an invoice.",
      );
    }
    const room = mockRooms.find((item) => item.id === group.roomId);
    const tenant = mockTenants.find((item) => item.roomId === group.roomId);

    const issueDate = new Date(group.readingDate);
    const dueDate = new Date(group.readingDate);
    dueDate.setDate(dueDate.getDate() + settings.paymentTermsDays);

    const waterAmount =
      settings.waterBillingMode === "fixed"
        ? settings.waterFixedFee
        : (group.water?.consumption ?? 0) * settings.waterRatePerUnit;
    const electricAmount =
      group.electric.consumption * settings.electricRatePerUnit;
    const subtotal = waterAmount + electricAmount;
    const tax = subtotal * (settings.taxRate / 100);
    const total = subtotal + tax;

    const invoice: Invoice = {
      id: `${settings.invoicePrefix}-${issueDate.getFullYear()}-${String(mockInvoices.length + 1).padStart(3, "0")}`,
      roomId: group.roomId,
      roomNumber: group.roomNumber,
      tenantName: group.tenantName,
      billingPeriod: issueDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: "pending",
      waterUsage:
        settings.waterBillingMode === "fixed"
          ? 0
          : (group.water?.consumption ?? 0),
      waterRate:
        settings.waterBillingMode === "fixed" ? 0 : settings.waterRatePerUnit,
      waterAmount,
      waterBillingMode: settings.waterBillingMode,
      waterFixedFee: settings.waterFixedFee,
      electricUsage: group.electric.consumption,
      electricRate: settings.electricRatePerUnit,
      electricAmount,
      subtotal,
      tax,
      total,
      room,
      tenant,
      readings: [
        ...(group.water
          ? [
              {
                meterType: "water" as const,
                previousReading: group.water.previousReading,
                currentReading: group.water.currentReading,
                consumption: group.water.consumption,
                previousPhotoUrl: group.water.previousPhotoUrl,
                currentPhotoUrl: group.water.currentPhotoUrl,
              },
            ]
          : []),
        {
          meterType: "electric",
          previousReading: group.electric.previousReading,
          currentReading: group.electric.currentReading,
          consumption: group.electric.consumption,
          previousPhotoUrl: group.electric.previousPhotoUrl,
          currentPhotoUrl: group.electric.currentPhotoUrl,
        },
      ],
    };

    mockInvoices.push(invoice);
    return { invoice };
  },
};

export const adminsApi = {
  getAll: async () => {
    await delay();
    const admins = mockUsers.filter((user) => user.role === "admin");
    return { admins };
  },
  remove: async (id: string) => {
    await delay();
    const admin = mockUsers.find((u) => u.id === id && u.role === "admin");
    if (!admin) {
      throw new Error("Admin not found");
    }
    return { success: true };
  },
};

export const invitationsApi = {
  getAll: async () => {
    await delay();
    return { invitations: mockInvitations };
  },
  create: async (
    data: Pick<AdminInvitation, "email"> & { name: string; message?: string },
  ) => {
    await delay();
    if (!data.email || !data.name) {
      throw new Error("Email and name are required");
    }

    const inviteCode = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation: AdminInvitation = {
      id: `inv-${Date.now()}`,
      email: data.email,
      invitedBy: "owner-1",
      invitedByName: "Surachai Wongsakul",
      status: "pending",
      inviteCode,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    mockInvitations.push(invitation);
    return { invitation };
  },
  remove: async (id: string) => {
    await delay();
    const index = mockInvitations.findIndex((inv) => inv.id === id);
    if (index === -1) {
      throw new Error("Invitation not found");
    }
    mockInvitations.splice(index, 1);
    return { success: true };
  },
};

export const settingsApi = {
  get: async () => {
    await delay();
    return { settings };
  },
  update: async (updates: Partial<AdminSettings>) => {
    await delay();
    settings = { ...settings, ...updates };
    return { success: true, settings };
  },
};
