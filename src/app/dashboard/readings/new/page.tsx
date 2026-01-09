"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Droplets, Keyboard, Loader2, Zap } from "lucide-react";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { ConsumptionSummary } from "@/components/readings/consumption-summary";
import { MeterReadingSection } from "@/components/readings/meter-reading-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "@/lib/router";
import { createReadingFormSchema, mapZodErrors } from "@/lib/schemas";
import type { ReadingFormValues } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { calculateConsumption, validateImageFile } from "@/lib/validation";

type InputMode = "ocr" | "manual";
type MeterScope = "water" | "electric" | "both";

export default function NewReadingPage() {
  usePageTitle("New Reading");

  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
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
        throw new Error("Team ID is required to load settings");
      }
      return settingsApi.get(user.teamId);
    },
    enabled: !!user?.teamId,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const rooms = roomsQuery.data?.rooms ?? [];
  const [inputMode, setInputMode] = React.useState<InputMode>("ocr");
  const initialScope = ((): MeterScope => {
    const scope = searchParams.get("meter");
    return scope === "water" || scope === "electric" ? scope : "both";
  })();
  const initialDate =
    searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const initialRoomId = searchParams.get("roomId") ?? "";
  const [meterScope, setMeterScope] = React.useState<MeterScope>(initialScope);
  const isWaterFixed =
    settingsQuery.data?.settings.waterBillingMode === "fixed";

  React.useEffect(() => {
    if (isWaterFixed && meterScope !== "electric") {
      setMeterScope("electric");
    }
  }, [isWaterFixed, meterScope]);

  const [formData, setFormData] = React.useState<ReadingFormValues>({
    roomId: initialRoomId,
    readingDate: initialDate,
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

  const createReadingMutation = useMutation({
    mutationFn: (payload: {
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
    }) => readingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readings"] });
    },
  });

  const simulateOCR = async (_file: File): Promise<string> => {
    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Mock OCR result - in production, this would call your OCR API
    return (Math.random() * 1000 + 1000).toFixed(2);
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
        const ocrResult = await simulateOCR(file);
        setFormData((prev) => ({ ...prev, [readingField]: ocrResult }));
        toast({
          title: "OCR Complete",
          description: `Extracted reading: ${ocrResult}`,
        });
      } catch (_error) {
        toast({
          title: "OCR Failed",
          description:
            "Could not extract reading from image. Please enter manually.",
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
      if (file) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, data } = validateForm();
    if (!isValid || !data) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
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

      await createReadingMutation.mutateAsync({
        roomId: data.roomId,
        readingDate: data.readingDate,
        water: includesWater
          ? {
              previousReading: Number.parseFloat(formData.waterPreviousReading),
              currentReading: Number.parseFloat(formData.waterCurrentReading),
              consumption: waterConsumption ?? 0,
              previousPhotoUrl: formData.waterPreviousPhoto
                ? URL.createObjectURL(formData.waterPreviousPhoto)
                : "/placeholder.svg",
              currentPhotoUrl: formData.waterCurrentPhoto
                ? URL.createObjectURL(formData.waterCurrentPhoto)
                : "/placeholder.svg",
            }
          : undefined,
        electric: includesElectric
          ? {
              previousReading: Number.parseFloat(
                formData.electricPreviousReading,
              ),
              currentReading: Number.parseFloat(
                formData.electricCurrentReading,
              ),
              consumption: electricConsumption ?? 0,
              previousPhotoUrl: formData.electricPreviousPhoto
                ? URL.createObjectURL(formData.electricPreviousPhoto)
                : "/placeholder.svg",
              currentPhotoUrl: formData.electricCurrentPhoto
                ? URL.createObjectURL(formData.electricCurrentPhoto)
                : "/placeholder.svg",
            }
          : undefined,
      });

      toast({
        title: "Success",
        description:
          includesWater && includesElectric
            ? "Meter readings added successfully"
            : "Reading saved. Complete the other meter when ready.",
      });

      router.push("/overview/readings");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add meter reading",
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

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="New Meter Reading"
        description={`${inputMode === "ocr" ? "Upload meter photos for automatic reading extraction" : "Enter meter readings manually"} • Add one meter now and complete the other later.`}
        showBack
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Reading Details</CardTitle>
            <div className="pt-4">
              <Tabs
                value={inputMode}
                onValueChange={(value) => setInputMode(value as InputMode)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ocr" className="gap-2">
                    <Camera className="h-4 w-4" />
                    <span className="hidden sm:inline">OCR Upload</span>
                    <span className="sm:hidden">OCR</span>
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="gap-2">
                    <Keyboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Manual Input</span>
                    <span className="sm:hidden">Manual</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="pt-4">
              <Label className="text-sm text-muted-foreground">
                Meter Type
              </Label>
              <ToggleGroup
                type="single"
                value={meterScope}
                onValueChange={(value) => {
                  if (value) {
                    setMeterScope(value as MeterScope);
                  }
                }}
                variant="outline"
                className="mt-2 w-full"
              >
                {!isWaterFixed && (
                  <ToggleGroupItem value="both">
                    Water + Electric
                  </ToggleGroupItem>
                )}
                {!isWaterFixed && (
                  <ToggleGroupItem value="water">Water Only</ToggleGroupItem>
                )}
                <ToggleGroupItem value="electric">
                  Electric Only
                </ToggleGroupItem>
              </ToggleGroup>
              {isWaterFixed && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Water is billed as a fixed monthly fee.
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Room Selection */}
            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Select
                value={formData.roomId}
                onValueChange={(value) =>
                  setFormData({ ...formData, roomId: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger
                  className={errors.roomId ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.buildingName} - Room {room.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roomId && (
                <p className="text-sm text-destructive">{errors.roomId}</p>
              )}
            </div>

            {/* Reading Date */}
            <div className="space-y-2">
              <Label htmlFor="readingDate">Reading Date</Label>
              <Input
                id="readingDate"
                type="date"
                value={formData.readingDate}
                onChange={(e) =>
                  setFormData({ ...formData, readingDate: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-6">
              {includesWater ? (
                <MeterReadingSection
                  title="Water Meter"
                  icon={<Droplets className="h-5 w-5 text-blue-500" />}
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
                  title="Electric Meter"
                  icon={<Zap className="h-5 w-5 text-amber-500" />}
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
                    setFormData({ ...formData, electricPreviousReading: value })
                  }
                  onCurrentReadingChange={(value) =>
                    setFormData({ ...formData, electricCurrentReading: value })
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

            {/* Consumption Display */}
            <ConsumptionSummary
              water={waterConsumption}
              electric={electricConsumption}
            />

            {/* Submit Button */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading || isProcessingOCR}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isProcessingOCR}
                className="w-full sm:flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Reading"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
