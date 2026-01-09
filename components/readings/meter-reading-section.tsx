import type * as React from "react";
import { ImageUpload } from "@/components/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MeterReadingSectionProps {
  title: string;
  icon: React.ReactNode;
  unit: string;
  mode: "ocr" | "manual";
  previousReading: string;
  currentReading: string;
  previousPhoto: File | null;
  currentPhoto: File | null;
  errors: Record<string, string>;
  previousReadingKey: string;
  currentReadingKey: string;
  previousPhotoKey: string;
  currentPhotoKey: string;
  onPreviousReadingChange: (value: string) => void;
  onCurrentReadingChange: (value: string) => void;
  onPreviousPhotoChange: (file: File | null) => void;
  onCurrentPhotoChange: (file: File | null) => void;
  disabled: boolean;
  isProcessingOCR: boolean;
}

export function MeterReadingSection({
  title,
  icon,
  unit,
  mode,
  previousReading,
  currentReading,
  previousPhoto,
  currentPhoto,
  errors,
  previousReadingKey,
  currentReadingKey,
  previousPhotoKey,
  currentPhotoKey,
  onPreviousReadingChange,
  onCurrentReadingChange,
  onPreviousPhotoChange,
  onCurrentPhotoChange,
  disabled,
  isProcessingOCR,
}: MeterReadingSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium">{title}</h3>
      </div>

      {mode === "ocr" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload
            label={`Upload Previous ${title} Photo`}
            value={previousPhoto}
            onChange={onPreviousPhotoChange}
            error={errors[previousPhotoKey]}
            disabled={disabled || isProcessingOCR}
          />
          <ImageUpload
            label={`Upload Current ${title} Photo`}
            value={currentPhoto}
            onChange={onCurrentPhotoChange}
            error={errors[currentPhotoKey]}
            disabled={disabled || isProcessingOCR}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${previousReadingKey}-input`}>
            Previous Reading ({unit})
          </Label>
          <Input
            id={`${previousReadingKey}-input`}
            type="number"
            step="0.01"
            placeholder={
              mode === "ocr"
                ? "Reading will be extracted automatically"
                : "123.45"
            }
            value={previousReading}
            onChange={(e) => onPreviousReadingChange(e.target.value)}
            disabled={disabled}
            className={errors[previousReadingKey] ? "border-destructive" : ""}
          />
          {errors[previousReadingKey] && (
            <p className="text-sm text-destructive">
              {errors[previousReadingKey]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${currentReadingKey}-input`}>
            Current Reading ({unit})
          </Label>
          <Input
            id={`${currentReadingKey}-input`}
            type="number"
            step="0.01"
            placeholder={
              mode === "ocr"
                ? "Reading will be extracted automatically"
                : "167.89"
            }
            value={currentReading}
            onChange={(e) => onCurrentReadingChange(e.target.value)}
            disabled={disabled}
            className={errors[currentReadingKey] ? "border-destructive" : ""}
          />
          {errors[currentReadingKey] && (
            <p className="text-sm text-destructive">
              {errors[currentReadingKey]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
