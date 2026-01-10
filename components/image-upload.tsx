"use client";

import { Upload, X } from "lucide-react";
import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function ImageUpload({
  label,
  value,
  onChange,
  error,
  disabled,
}: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (value) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleRemove = () => {
    onChange(null);
  };

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        onChange(acceptedFiles[0]);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
  });

  const inputId = React.useId();

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>

      {!preview ? (
        <div
          {...getRootProps()}
          className={cn(
            "relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-center transition-colors hover:bg-muted/50",
            isDragActive && "border-primary bg-primary/5",
            disabled && "cursor-not-allowed opacity-50",
            error && "border-destructive",
          )}
        >
          <input {...getInputProps({ id: inputId })} />
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isDragActive
              ? "วางรูปที่นี่"
              : "ลากและวาง หรือคลิกเพื่ออัปโหลด"}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP (สูงสุด 5MB)
          </p>
        </div>
      ) : (
        <div className="relative h-40 rounded-lg border border-border bg-muted overflow-hidden">
          <img
            src={preview || "/placeholder.svg"}
            alt="ตัวอย่างรูป"
            className="h-full w-full object-cover"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
