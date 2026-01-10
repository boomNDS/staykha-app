"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AdminRestrictionBannerProps {
  title?: string;
  message?: string;
  action?: string;
}

export function AdminRestrictionBanner({
  title = "ต้องให้เจ้าของดำเนินการ",
  message = "เฉพาะเจ้าของเท่านั้นที่สามารถทำรายการนี้ได้ โปรดติดต่อเจ้าของทีมเพื่อดำเนินการตั้งค่านี้",
  action,
}: AdminRestrictionBannerProps) {
  return (
    <Alert variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">{title}</AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        {message}
        {action && (
          <span className="mt-1 block font-medium">{action}</span>
        )}
      </AlertDescription>
    </Alert>
  );
}
