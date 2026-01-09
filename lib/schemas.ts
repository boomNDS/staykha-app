import { z } from "zod";

const numberString = (label: string) =>
  z
    .string()
    .refine(
      (value) => value === "" || !Number.isNaN(Number(value)),
      `${label} must be a number`,
    );

export const tenantDraftSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Email is invalid"),
  phone: z.string().min(1, "Phone is required"),
  moveInDate: z.string().min(1, "Move-in date is required"),
  deposit: numberString("Deposit").optional(),
});

export const roomFormSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  buildingId: z.string().min(1, "Building is required"),
  floor: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
      "Floor must be at least 1",
    ),
  status: z.enum(["occupied", "vacant", "maintenance"]),
  monthlyRent: numberString("Monthly rent"),
  size: numberString("Room size"),
});

export const bulkRoomSchema = z
  .object({
    buildingId: z.string().min(1, "Building is required"),
    floorStart: z
      .string()
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
        "Floor start must be at least 1",
      ),
    floorEnd: z
      .string()
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
        "Floor end must be at least 1",
      ),
    roomsPerFloor: z
      .string()
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
        "Rooms per floor must be at least 1",
      ),
    startIndex: z
      .string()
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
        "Start index must be at least 1",
      ),
    status: z.enum(["occupied", "vacant", "maintenance"]),
    monthlyRent: numberString("Monthly rent"),
    size: numberString("Room size"),
  })
  .superRefine((data, ctx) => {
    if (Number(data.floorEnd) < Number(data.floorStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["floorEnd"],
        message: "Floor end must be greater than or equal to floor start",
      });
    }
  });

export const tenantFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Email is invalid"),
  phone: z.string().min(1, "Phone is required"),
  roomId: z.string().min(1, "Room is required"),
  moveInDate: z.string().min(1, "Move-in date is required"),
  contractEndDate: z.string().optional(),
  monthlyRent: numberString("Monthly rent"),
  deposit: numberString("Deposit"),
  idCardNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  status: z.enum(["active", "inactive", "expired"]),
});

export const createReadingFormSchema = (
  mode: "ocr" | "manual",
  meterScope: "water" | "electric" | "both",
) =>
  z
    .object({
      roomId: z.string().min(1, "Please select a room"),
      readingDate: z.string().min(1, "Reading date is required"),
      waterPreviousReading: z.string().optional(),
      waterCurrentReading: z.string().optional(),
      electricPreviousReading: z.string().optional(),
      electricCurrentReading: z.string().optional(),
      waterPreviousPhoto: z.instanceof(File).nullable().optional(),
      waterCurrentPhoto: z.instanceof(File).nullable().optional(),
      electricPreviousPhoto: z.instanceof(File).nullable().optional(),
      electricCurrentPhoto: z.instanceof(File).nullable().optional(),
    })
    .superRefine((data, ctx) => {
      const includesWater = meterScope !== "electric";
      const includesElectric = meterScope !== "water";

      const isEmpty = (value?: string) =>
        value === undefined || value.trim() === "";
      const parseValue = (value?: string) => {
        if (isEmpty(value)) return null;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
      };

      const validateMeter = ({
        previous,
        current,
        previousKey,
        currentKey,
        label,
      }: {
        previous?: string;
        current?: string;
        previousKey: "waterPreviousReading" | "electricPreviousReading";
        currentKey: "waterCurrentReading" | "electricCurrentReading";
        label: string;
      }) => {
        if (isEmpty(previous)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [previousKey],
            message: "Required",
          });
        } else if (parseValue(previous) === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [previousKey],
            message: `${label} must be a number`,
          });
        }

        if (isEmpty(current)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [currentKey],
            message: "Required",
          });
        } else if (parseValue(current) === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [currentKey],
            message: `${label} must be a number`,
          });
        }

        const prevValue = parseValue(previous);
        const currentValue = parseValue(current);
        if (
          prevValue !== null &&
          currentValue !== null &&
          currentValue < prevValue
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [currentKey],
            message: "Current reading must be >= previous reading",
          });
        }
      };

      if (includesWater) {
        validateMeter({
          previous: data.waterPreviousReading,
          current: data.waterCurrentReading,
          previousKey: "waterPreviousReading",
          currentKey: "waterCurrentReading",
          label: "Water reading",
        });
      }

      if (includesElectric) {
        validateMeter({
          previous: data.electricPreviousReading,
          current: data.electricCurrentReading,
          previousKey: "electricPreviousReading",
          currentKey: "electricCurrentReading",
          label: "Electric reading",
        });
      }

      if (mode === "ocr") {
        if (includesWater && !data.waterPreviousPhoto) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["waterPreviousPhoto"],
            message: "Required",
          });
        }
        if (includesWater && !data.waterCurrentPhoto) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["waterCurrentPhoto"],
            message: "Required",
          });
        }
        if (includesElectric && !data.electricPreviousPhoto) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["electricPreviousPhoto"],
            message: "Required",
          });
        }
        if (includesElectric && !data.electricCurrentPhoto) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["electricCurrentPhoto"],
            message: "Required",
          });
        }
      }
    });

export const loginSchema = z.object({
  email: z.string().email("Email is invalid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Email is invalid"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    passwordConfirm: z.string().min(6, "Password confirmation is required"),
    role: z.enum(["owner", "admin"], {
      required_error: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email is invalid"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    passwordConfirm: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export function mapZodErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  });
  return errors;
}
