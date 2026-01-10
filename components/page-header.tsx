"use client";

import { ArrowLeft } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/router";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  showBack = false,
  backHref,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={cn("border-b border-border pb-5 sm:pb-6", className)}>
      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (backHref) {
                  router.push(backHref);
                  return;
                }
                if (window.history.length > 1) {
                  router.back();
                  return;
                }
                router.push("/overview");
              }}
              aria-label="ย้อนกลับ"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="font-heading text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
