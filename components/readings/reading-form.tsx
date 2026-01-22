"use client";

import { createWorker } from "tesseract.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Camera,
  Droplets,
  Keyboard,
  Loader2,
  Zap,
} from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/empty-state";
import { ConsumptionSummary } from "@/components/readings/consumption-summary";
import { MeterReadingSection } from "@/components/readings/meter-reading-section";
import { SettingsRequired } from "@/components/settings-required";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { readingsApi, roomsApi, settingsApi } from "@/lib/api-client";
import { getData, getList } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, logError } from "@/lib/error-utils";
import { useRouter } from "@/lib/router";
import { createReadingFormSchema, mapZodErrors } from "@/lib/schemas";
import type { ReadingFormValues } from "@/lib/types";
import { WaterBillingMode } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { calculateConsumption, validateImageFile } from "@/lib/validation";

type InputMode = "ocr" | "manual";
type MeterScope = "water" | "electric" | "both";

type ReadingFormProps = {
  initialRoomId?: string;
  initialDate?: string;
  initialMeterScope?: MeterScope;
  readingGroupId?: string | null;
  lockRoom?: boolean;
  lockDate?: boolean;
  lockMeterScope?: boolean;
  showCancel?: boolean;
  onSuccess?: () => void;
};

const normalizeDateParam = (value: string) => {
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return value;
};

const todayValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function ReadingForm({
  initialRoomId = "",
  initialDate = "",
  initialMeterScope = "both",
  readingGroupId = null,
  lockRoom = false,
  lockDate = false,
  lockMeterScope = false,
  showCancel = true,
  onSuccess,
}: ReadingFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const settingsQuery = useQuery({
    queryKey: ["settings", user?.teamId],
    queryFn: () => {
      if (!user?.teamId) {
        throw new Error("จำเป็นต้องมี Team ID เพื่อโหลด Settings");
      }
      return settingsApi.get(user.teamId);
    },
    enabled: !!user?.teamId,
  });
  const readingGroupQuery = useQuery({
    queryKey: ["readings", readingGroupId],
    queryFn: () => {
      if (!readingGroupId) {
        throw new Error("Missing reading group id");
      }
      return readingsApi.getById(readingGroupId);
    },
    enabled: Boolean(readingGroupId),
  });
  const [isLoading, setIsLoading] = React.useState(false);
  // Rooms API returns array directly
  const rooms = roomsQuery.data ?? [];
  const normalizedInitialDate = normalizeDateParam(initialDate || todayValue());
  const [inputMode, setInputMode] = React.useState<InputMode>("ocr");
  const [meterScope, setMeterScope] =
    React.useState<MeterScope>(initialMeterScope);
  const existingGroup = getData(readingGroupQuery.data);
  const [formData, setFormData] = React.useState<ReadingFormValues>({
    roomId: initialRoomId,
    readingDate: normalizedInitialDate,
    waterPreviousReading: "",
    waterCurrentReading: "",
    electricPreviousReading: "",
    electricCurrentReading: "",
    waterPreviousPhoto: null as File | null,
    waterCurrentPhoto: null as File | null,
    electricPreviousPhoto: null as File | null,
    electricCurrentPhoto: null as File | null,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isProcessingOCR, setIsProcessingOCR] = React.useState(false);

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateString = (value: string) => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const settings = getData(settingsQuery.data);
  const isWaterFixed = settings?.waterBillingMode === WaterBillingMode.FIXED;
  const selectedDate = parseDateString(formData.readingDate) ?? new Date();

  React.useEffect(() => {
    if (isWaterFixed && meterScope !== "electric") {
      setMeterScope("electric");
    }
  }, [isWaterFixed, meterScope]);

  React.useEffect(() => {
    if (!existingGroup) return;
    setFormData((prev) => ({
      ...prev,
      roomId: existingGroup.roomId,
      readingDate: normalizeDateParam(existingGroup.readingDate),
    }));
  }, [existingGroup]);

  const createReadingMutation = useMutation({
    mutationFn: (payload: {
      roomId: string;
      readingDate: string;
      water?: {
        previousReading: number;
        currentReading: number;
        previousPhotoUrl: string | null;
        currentPhotoUrl: string | null;
      };
      electric?: {
        previousReading: number;
        currentReading: number;
        previousPhotoUrl: string | null;
        currentPhotoUrl: string | null;
      };
    }) => readingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readings"] });
    },
  });

  const performOCR = async (file: File): Promise<string> => {
    const worker = await createWorker("eng");

    try {
      const {
        data: { text },
      } = await worker.recognize(file);

      const numbers = text.match(/\d+\.?\d*/g);

      if (numbers && numbers.length > 0) {
        const readings = numbers.map(Number).filter((n) => !Number.isNaN(n));
        if (readings.length > 0) {
          const maxReading = Math.max(...readings);
          return maxReading.toFixed(2);
        }
      }

      const fallbackNumber = text.match(/[\d,]+\.?\d*/);
      if (fallbackNumber) {
        const value = Number.parseFloat(fallbackNumber[0].replace(/,/g, ""));
        if (!Number.isNaN(value)) {
          return value.toFixed(2);
        }
      }

      throw new Error("ไม่พบตัวเลขในรูปภาพ");
    } finally {
      await worker.terminate();
    }
  };

  const handlePhotoUpload = async (
    file: File | null,
    photoField: keyof typeof formData,
    readingField: keyof typeof formData,
  ) => {
    setFormData({ ...formData, [photoField]: file });

    if (file && inputMode === "ocr") {
      setIsProcessingOCR(true);
      try {
        const ocrResult = await performOCR(file);
        setFormData((prev) => ({ ...prev, [readingField]: ocrResult }));
        toast({
          title: "OCR สำเร็จ",
          description: `ค่าที่อ่านได้: ${ocrResult}`,
        });
      } catch (error) {
        console.error("OCR error:", error);
        toast({
          title: "OCR ไม่สำเร็จ",
          description:
            error instanceof Error
              ? `ไม่สามารถอ่านค่าได้: ${error.message} กรุณากรอกเอง`
              : "ไม่สามารถอ่านค่าได้จากรูปภาพ กรุณากรอกเอง",
          variant: "destructive",
        });
      } finally {
        setIsProcessingOCR(false);
      }
    }
  };

  const validateForm = () => {
    const result = createReadingFormSchema(inputMode, meterScope).safeParse(
      formData,
    );
    const newErrors = result.success ? {} : mapZodErrors(result.error);

    const photoFields: Array<keyof ReadingFormValues> = [
      "waterPreviousPhoto",
      "waterCurrentPhoto",
      "electricPreviousPhoto",
      "electricCurrentPhoto",
    ];

    photoFields.forEach((field) => {
      const file = formData[field];
      if (file instanceof File) {
        const photoError = validateImageFile(file);
        if (photoError && !newErrors[field]) {
          newErrors[field] = photoError.message;
        }
      }
    });

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      data: result.success ? result.data : null,
    };
  };

  const invalidateReadings = () => {
    queryClient.invalidateQueries({ queryKey: ["readings"] });
    if (readingGroupId) {
      queryClient.invalidateQueries({ queryKey: ["readings", readingGroupId] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, data } = validateForm();
    if (!isValid || !data) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณาแก้ไขข้อมูลที่ผิดพลาด",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const includesWater = meterScope !== "electric";
      const includesElectric = meterScope !== "water";
      const waterConsumption = includesWater
        ? calculateConsumption(
            Number.parseFloat(formData.waterPreviousReading),
            Number.parseFloat(formData.waterCurrentReading),
          )
        : null;
      const electricConsumption = includesElectric
        ? calculateConsumption(
            Number.parseFloat(formData.electricPreviousReading),
            Number.parseFloat(formData.electricCurrentReading),
          )
        : null;

      // API expects: water/electric objects with previousReading, currentReading, photoUrls
      // meterType is inferred from the key name, consumption is calculated automatically
      const nextWater = includesWater
        ? {
            previousReading: Number.parseFloat(formData.waterPreviousReading),
            currentReading: Number.parseFloat(formData.waterCurrentReading),
            previousPhotoUrl: formData.waterPreviousPhoto
              ? URL.createObjectURL(formData.waterPreviousPhoto)
              : null,
            currentPhotoUrl: formData.waterCurrentPhoto
              ? URL.createObjectURL(formData.waterCurrentPhoto)
              : null,
          }
        : undefined;
      const nextElectric = includesElectric
        ? {
            previousReading: Number.parseFloat(
              formData.electricPreviousReading,
            ),
            currentReading: Number.parseFloat(formData.electricCurrentReading),
            previousPhotoUrl: formData.electricPreviousPhoto
              ? URL.createObjectURL(formData.electricPreviousPhoto)
              : null,
            currentPhotoUrl: formData.electricCurrentPhoto
              ? URL.createObjectURL(formData.electricCurrentPhoto)
              : null,
          }
        : undefined;

      if (readingGroupId) {
        const requiresWater = settings
          ? settings.waterBillingMode !== WaterBillingMode.FIXED
          : true;
        const hasWater = Boolean(nextWater ?? existingGroup?.water);
        const hasElectric = Boolean(nextElectric ?? existingGroup?.electric);
        const status =
          hasElectric && (!requiresWater || hasWater)
            ? "pending"
            : "incomplete";

        // Update API expects partial MeterReadingGroup
        // The water/electric objects are partial MeterReading objects
        await readingsApi.update(readingGroupId, {
          water: nextWater as Partial<import("@/lib/types").MeterReading>,
          electric: nextElectric as Partial<import("@/lib/types").MeterReading>,
          status,
        });
        invalidateReadings();
      } else {
        await createReadingMutation.mutateAsync({
          roomId: data.roomId,
          readingDate: data.readingDate,
          water: nextWater,
          electric: nextElectric,
        });
      }

      toast({
        title: "บันทึกสำเร็จ",
        description:
          includesWater && includesElectric
            ? "บันทึกการอ่านมิเตอร์เรียบร้อย"
            : "บันทึกแล้ว สามารถเติมอีกมิเตอร์ภายหลังได้",
      });

      if (onSuccess) {
        onSuccess();
      } else if (readingGroupId) {
        router.push(`/overview/readings/${readingGroupId}`);
      } else {
        router.push("/overview/readings");
      }
    } catch (error: any) {
      logError(error, {
        scope: "readings",
        action: readingGroupId ? "update" : "create",
        metadata: {
          roomId: formData.roomId,
          readingDate: formData.readingDate,
        },
      });
      toast({
        title: "เกิดข้อผิดพลาด",
        description: getErrorMessage(
          error,
          readingGroupId
            ? "ไม่สามารถอัปเดตการอ่านมิเตอร์ได้"
            : "ไม่สามารถเพิ่มการอ่านมิเตอร์ได้",
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const includesWater = meterScope !== "electric";
  const includesElectric = meterScope !== "water";
  const waterConsumption =
    includesWater &&
    formData.waterPreviousReading &&
    formData.waterCurrentReading
      ? calculateConsumption(
          Number.parseFloat(formData.waterPreviousReading),
          Number.parseFloat(formData.waterCurrentReading),
        )
      : null;
  const electricConsumption =
    includesElectric &&
    formData.electricPreviousReading &&
    formData.electricCurrentReading
      ? calculateConsumption(
          Number.parseFloat(formData.electricPreviousReading),
          Number.parseFloat(formData.electricCurrentReading),
        )
      : null;

  if (settingsQuery.isSuccess && !settings) {
    return (
      <SettingsRequired
        title="ต้องตั้งค่า Settings ก่อนใช้งาน"
        description="คุณต้องสร้าง Settings ของทีมก่อนจึงจะเพิ่มการอ่านมิเตอร์ได้"
      />
    );
  }

  if (roomsQuery.isSuccess && rooms.length === 0) {
    return (
      <EmptyState
        icon={<Droplets className="h-8 w-8 text-muted-foreground" />}
        title="ต้องสร้างห้องก่อนเพิ่มมิเตอร์"
        description="ยังไม่มีห้องในระบบ กรุณาสร้างห้องเพื่อบันทึกการอ่านมิเตอร์"
        actionLabel="เพิ่มห้อง"
        actionHref="/overview/rooms/new"
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดการอ่าน</CardTitle>
          <div className="pt-4">
            <Tabs
              value={inputMode}
              onValueChange={(value) => setInputMode(value as InputMode)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ocr" className="gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">อัปโหลด OCR</span>
                  <span className="sm:hidden">OCR</span>
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <Keyboard className="h-4 w-4" />
                  <span className="hidden sm:inline">กรอกเอง</span>
                  <span className="sm:hidden">กรอกเอง</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="pt-4">
            <Label className="text-sm text-muted-foreground">ประเภทมิเตอร์</Label>
            <ToggleGroup
              type="single"
              value={meterScope}
              onValueChange={(value) => {
                if (value && !lockMeterScope) {
                  setMeterScope(value as MeterScope);
                }
              }}
              variant="outline"
              className="mt-2 w-full"
            >
              {!isWaterFixed && (
                <ToggleGroupItem value="both" disabled={lockMeterScope}>
                  น้ำ + ไฟ
                </ToggleGroupItem>
              )}
              {!isWaterFixed && (
                <ToggleGroupItem value="water" disabled={lockMeterScope}>
                  เฉพาะน้ำ
                </ToggleGroupItem>
              )}
              <ToggleGroupItem value="electric" disabled={lockMeterScope}>
                เฉพาะไฟ
              </ToggleGroupItem>
            </ToggleGroup>
            {isWaterFixed && (
              <p className="mt-2 text-xs text-muted-foreground">
                ค่าน้ำคิดแบบเหมาจ่ายรายเดือน
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="room">ห้อง</Label>
            <Select
              value={formData.roomId}
              onValueChange={(value) =>
                setFormData({ ...formData, roomId: value })
              }
              disabled={isLoading || lockRoom}
            >
              <SelectTrigger
                className={errors.roomId ? "border-destructive" : ""}
              >
                <SelectValue placeholder="เลือกห้อง" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.buildingName} - ห้อง {room.roomNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roomId && (
              <p className="text-sm text-destructive">{errors.roomId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="readingDate">วันที่อ่านมิเตอร์</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isLoading || lockDate}
                  className={cn(
                    "w-full justify-between",
                    errors.readingDate ? "border-destructive" : "",
                  )}
                >
                  <span>
                    {selectedDate ? formatDate(selectedDate) : "เลือกวันที่"}
                  </span>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({
                        ...formData,
                        readingDate: toDateInputValue(date),
                      });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.readingDate && (
              <p className="text-sm text-destructive">{errors.readingDate}</p>
            )}
          </div>

          <div className="space-y-6">
            {includesWater ? (
              <MeterReadingSection
                title="มิเตอร์น้ำ"
                icon={<Droplets className="h-5 w-5 text-slate-500" />}
                unit="m³"
                mode={inputMode}
                previousReading={formData.waterPreviousReading}
                currentReading={formData.waterCurrentReading}
                previousPhoto={formData.waterPreviousPhoto}
                currentPhoto={formData.waterCurrentPhoto}
                errors={errors}
                previousReadingKey="waterPreviousReading"
                currentReadingKey="waterCurrentReading"
                previousPhotoKey="waterPreviousPhoto"
                currentPhotoKey="waterCurrentPhoto"
                onPreviousReadingChange={(value) =>
                  setFormData({ ...formData, waterPreviousReading: value })
                }
                onCurrentReadingChange={(value) =>
                  setFormData({ ...formData, waterCurrentReading: value })
                }
                onPreviousPhotoChange={(file) =>
                  handlePhotoUpload(
                    file,
                    "waterPreviousPhoto",
                    "waterPreviousReading",
                  )
                }
                onCurrentPhotoChange={(file) =>
                  handlePhotoUpload(
                    file,
                    "waterCurrentPhoto",
                    "waterCurrentReading",
                  )
                }
                disabled={isLoading}
                isProcessingOCR={isProcessingOCR}
              />
            ) : null}

            {includesElectric ? (
              <MeterReadingSection
                title="มิเตอร์ไฟ"
                icon={<Zap className="h-5 w-5 text-slate-500" />}
                unit="kWh"
                mode={inputMode}
                previousReading={formData.electricPreviousReading}
                currentReading={formData.electricCurrentReading}
                previousPhoto={formData.electricPreviousPhoto}
                currentPhoto={formData.electricCurrentPhoto}
                errors={errors}
                previousReadingKey="electricPreviousReading"
                currentReadingKey="electricCurrentReading"
                previousPhotoKey="electricPreviousPhoto"
                currentPhotoKey="electricCurrentPhoto"
                onPreviousReadingChange={(value) =>
                  setFormData({
                    ...formData,
                    electricPreviousReading: value,
                  })
                }
                onCurrentReadingChange={(value) =>
                  setFormData({
                    ...formData,
                    electricCurrentReading: value,
                  })
                }
                onPreviousPhotoChange={(file) =>
                  handlePhotoUpload(
                    file,
                    "electricPreviousPhoto",
                    "electricPreviousReading",
                  )
                }
                onCurrentPhotoChange={(file) =>
                  handlePhotoUpload(
                    file,
                    "electricCurrentPhoto",
                    "electricCurrentReading",
                  )
                }
                disabled={isLoading}
                isProcessingOCR={isProcessingOCR}
              />
            ) : null}
          </div>

          <ConsumptionSummary
            water={waterConsumption}
            electric={electricConsumption}
          />

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
            {showCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading || isProcessingOCR}
                className="w-full sm:w-auto"
              >
                ยกเลิก
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || isProcessingOCR}
              className="w-full sm:flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกการอ่าน"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
