import * as React from "react";
import { useDropzone as useReactDropzone } from "react-dropzone";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DropzoneOptions = {
  accept?: Parameters<typeof useReactDropzone>[0]["accept"];
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  onFilesChange?: (files: File[]) => void;
};

type DropzoneContextValue = {
  getRootProps: ReturnType<typeof useReactDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useReactDropzone>["getInputProps"];
  files: File[];
  isDragActive: boolean;
  errorMessage?: string;
  removeFile: (index: number) => void;
  disabled?: boolean;
};

const DropzoneContext = React.createContext<DropzoneContextValue | null>(null);

export function useDropzone(options: DropzoneOptions = {}) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  const dropzone = useReactDropzone({
    accept: options.accept,
    maxFiles: options.maxFiles,
    multiple: options.multiple,
    disabled: options.disabled,
    onDropAccepted: (acceptedFiles) => {
      setErrorMessage(undefined);
      const nextFiles = options.multiple ? acceptedFiles : acceptedFiles.slice(0, 1);
      setFiles(nextFiles);
      options.onFilesChange?.(nextFiles);
    },
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (!rejection) {
        setErrorMessage("ไม่สามารถอัปโหลดไฟล์ได้");
        return;
      }
      const message = rejection.errors.map((error) => error.message).join(", ");
      setErrorMessage(message);
    },
  });

  const removeFile = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);
    options.onFilesChange?.(nextFiles);
  };

  return {
    getRootProps: dropzone.getRootProps,
    getInputProps: dropzone.getInputProps,
    files,
    isDragActive: dropzone.isDragActive,
    errorMessage,
    removeFile,
    disabled: options.disabled,
  };
}

export function Dropzone({
  children,
  ...value
}: React.PropsWithChildren<DropzoneContextValue>) {
  return (
    <DropzoneContext.Provider value={value}>
      <div className="space-y-3">{children}</div>
    </DropzoneContext.Provider>
  );
}

export function DropZoneArea({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DropzoneContext);
  if (!context) {
    throw new Error("DropZoneArea must be used within Dropzone");
  }
  const { getRootProps, getInputProps, isDragActive, disabled } = context;
  return (
    <div
      {...getRootProps()}
      className={cn(
        "rounded-lg border border-dashed border-border bg-muted/10 p-4 transition-colors",
        isDragActive && "border-primary/60 bg-primary/5",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      {...props}
    >
      <input {...getInputProps()} />
      {props.children}
    </div>
  );
}

export function DropzoneTrigger({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="font-medium text-foreground">{children}</span>
      <span className="text-xs">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</span>
    </div>
  );
}

export function DropzoneMessage() {
  const context = React.useContext(DropzoneContext);
  if (!context) {
    throw new Error("DropzoneMessage must be used within Dropzone");
  }
  if (!context.errorMessage) return null;
  return (
    <p className="text-xs text-destructive">{context.errorMessage}</p>
  );
}

export function DropzoneFileList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function DropzoneFileListItem({
  file,
  index,
}: {
  file: File;
  index: number;
}) {
  const context = React.useContext(DropzoneContext);
  if (!context) {
    throw new Error("DropzoneFileListItem must be used within Dropzone");
  }
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border border-border",
        "bg-background px-3 py-2 text-xs text-muted-foreground",
      )}
    >
      <span className="font-medium text-foreground">{file.name}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => context.removeFile(index)}
        className="h-7 w-7"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
