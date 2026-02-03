import { Link } from "@tanstack/react-router";
import { FileQuestion, Plus } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  variant?: "inset" | "page";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  actionHref,
  onAction,
  className,
  variant = "inset",
}: EmptyStateProps) {
  const variantClassName =
    variant === "page"
      ? "rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm md:p-12"
      : "rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center md:p-12";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        variantClassName,
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-3">
        {icon || <FileQuestion className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action || null}
      {!action && actionLabel && actionHref && (
        <Button asChild>
          <Link to={actionHref}>
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel}
          </Link>
        </Button>
      )}
      {!action && actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
