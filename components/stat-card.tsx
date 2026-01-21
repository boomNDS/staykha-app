import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/70 bg-card/90 shadow-sm">
      <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-8 rounded-full bg-primary/10 blur-2xl" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div>
              <div className="font-heading text-2xl font-semibold text-foreground">
                {value}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={cn(
                    "font-medium",
                    trend.value > 0 ? "text-slate-600" : "text-slate-500",
                  )}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("rounded-2xl bg-primary/10 p-3", iconClassName)}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
