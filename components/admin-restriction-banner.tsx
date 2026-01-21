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
    <Alert
      variant="default"
      className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
    >
      <AlertCircle className="h-4 w-4 text-slate-600 dark:text-slate-300" />
      <AlertTitle className="text-slate-900 dark:text-slate-100">
        {title}
      </AlertTitle>
      <AlertDescription className="text-slate-700 dark:text-slate-200">
        {message}
        {action && <span className="mt-1 block font-medium">{action}</span>}
      </AlertDescription>
    </Alert>
  );
}
