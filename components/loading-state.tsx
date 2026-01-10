import UniqueLoading from "@/components/ui/morph-loading";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "กำลังโหลด...",
  fullScreen = false,
  className = "",
  size = "md",
}: LoadingStateProps) {
  const containerClass = fullScreen
    ? "flex h-screen items-center justify-center"
    : "flex h-32 items-center justify-center";

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="text-center">
        <div className="mx-auto mb-4 flex items-center justify-center">
          <UniqueLoading variant="morph" size={size} />
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
