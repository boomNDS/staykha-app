import { z } from "zod";

const numberString = (label: string) =>
  z
    .string()
    .refine(
      (value) => value === "" || !Number.isNaN(Number(value)),
      `${label} ต้องเป็นตัวเลข`,
    );

export const tenantDraftSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  phone: z.string().min(1, "กรุณากรอกเบอร์โทร"),
  moveInDate: z.string().min(1, "กรุณาเลือกวันที่ย้ายเข้า"),
  deposit: numberString("เงินประกัน").optional(),
});

export const roomFormSchema = z.object({
  roomNumber: z.string().min(1, "กรุณากรอกเลขห้อง"),
  buildingId: z.string().min(1, "กรุณาเลือกอาคาร"),
  floor: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
      "ชั้นต้องมากกว่าหรือเท่ากับ 1",
    ),
  status: z.enum(["occupied", "vacant", "maintenance"]),
  monthlyRent: numberString("ค่าเช่ารายเดือน"),
  size: numberString("ขนาดห้อง"),
});

export const bulkRoomSchema = z
  .object({
    buildingId: z.string().min(1, "กรุณาเลือกอาคาร"),
    floorStart: z
      .string()
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
        "ชั้นเริ่มต้นต้องมากกว่าหรือเท่ากับ 1",
      ),
    floorEnd: z
      .string()
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
        "ชั้นสิ้นสุดต้องมากกว่าหรือเท่ากับ 1",
      ),
    roomsPerFloor: z
      .string()
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
        "จำนวนห้องต่อชั้นต้องมากกว่าหรือเท่ากับ 1",
      ),
    startIndex: z
      .string()
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
        "เลขเริ่มต้นต้องมากกว่าหรือเท่ากับ 1",
      ),
    status: z.enum(["occupied", "vacant", "maintenance"]),
    monthlyRent: numberString("ค่าเช่ารายเดือน"),
    size: numberString("ขนาดห้อง"),
  })
  .superRefine((data, ctx) => {
    if (Number(data.floorEnd) < Number(data.floorStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["floorEnd"],
        message: "ชั้นสิ้นสุดต้องมากกว่าหรือเท่ากับชั้นเริ่มต้น",
      });
    }
  });

export const tenantFormSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  phone: z.string().min(1, "กรุณากรอกเบอร์โทร"),
  roomId: z.string().min(1, "กรุณาเลือกห้อง"),
  moveInDate: z.string().min(1, "กรุณาเลือกวันที่ย้ายเข้า"),
  contractEndDate: z.string().optional(),
  monthlyRent: numberString("ค่าเช่ารายเดือน"),
  deposit: numberString("เงินประกัน"),
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
      roomId: z.string().min(1, "กรุณาเลือกห้อง"),
      readingDate: z.string().min(1, "กรุณาเลือกวันที่อ่านมิเตอร์"),
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
            message: "จำเป็นต้องกรอก",
          });
        } else if (parseValue(previous) === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [previousKey],
            message: `${label} ต้องเป็นตัวเลข`,
          });
        }

        if (isEmpty(current)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [currentKey],
            message: "จำเป็นต้องกรอก",
          });
        } else if (parseValue(current) === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [currentKey],
            message: `${label} ต้องเป็นตัวเลข`,
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
            message: "เลขล่าสุดต้องมากกว่าหรือเท่ากับเลขก่อนหน้า",
          });
        }
      };

      if (includesWater) {
        validateMeter({
          previous: data.waterPreviousReading,
          current: data.waterCurrentReading,
          previousKey: "waterPreviousReading",
          currentKey: "waterCurrentReading",
          label: "เลขมิเตอร์น้ำ",
        });
      }

      if (includesElectric) {
        validateMeter({
          previous: data.electricPreviousReading,
          current: data.electricCurrentReading,
          previousKey: "electricPreviousReading",
          currentKey: "electricCurrentReading",
          label: "เลขมิเตอร์ไฟ",
        });
      }

      if (mode === "ocr") {
        if (includesWater && !data.waterPreviousPhoto) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["waterPreviousPhoto"],
            message: "จำเป็นต้องกรอก",
          });
        }
        if (includesWater && !data.waterCurrentPhoto) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["waterCurrentPhoto"],
            message: "จำเป็นต้องกรอก",
          });
        }
        if (includesElectric && !data.electricPreviousPhoto) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["electricPreviousPhoto"],
            message: "จำเป็นต้องกรอก",
          });
        }
        if (includesElectric && !data.electricCurrentPhoto) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["electricCurrentPhoto"],
            message: "จำเป็นต้องกรอก",
          });
        }
      }
    });

export const loginSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อ"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    passwordConfirm: z.string().min(6, "กรุณายืนยันรหัสผ่าน"),
    role: z.enum(["owner", "admin"], {
      required_error: "กรุณาเลือกบทบาท",
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["passwordConfirm"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    passwordConfirm: z.string().min(6, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "รหัสผ่านไม่ตรงกัน",
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
