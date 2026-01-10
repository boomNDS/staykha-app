"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { ReadingForm } from "@/components/readings/reading-form";
import { readingsApi } from "@/lib/api-client";
import { useRouter, useSearchParams } from "@/lib/router";
import { usePageTitle } from "@/lib/use-page-title";

type MeterScope = "water" | "electric" | "both";

export default function NewReadingPage() {
  usePageTitle("เพิ่มการอ่านมิเตอร์");

  const router = useRouter();
  const searchParams = useSearchParams();
  const readingGroupId = searchParams.get("readingGroupId");
  const roomId = searchParams.get("roomId") ?? "";
  const dateParam = searchParams.get("date") ?? "";
  const meterParam = searchParams.get("meter");
  const initialScope = ((): MeterScope => {
    return meterParam === "water" || meterParam === "electric"
      ? meterParam
      : "both";
  })();

  const readingGroupLookupQuery = useQuery({
    queryKey: ["readings", "lookup", roomId, dateParam],
    queryFn: () => readingsApi.getByRoomDate(roomId, dateParam),
    enabled: Boolean(roomId && dateParam && !readingGroupId),
  });

  React.useEffect(() => {
    if (readingGroupId) return;
    const foundGroup = readingGroupLookupQuery.data?.reading;
    if (foundGroup) {
      router.replace(`/overview/readings/${foundGroup.id}`);
    }
  }, [readingGroupId, readingGroupLookupQuery.data?.reading, router]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="เพิ่มการอ่านมิเตอร์ใหม่"
        description="อัปโหลดรูปมิเตอร์เพื่ออ่านค่าอัตโนมัติ หรือกรอกตัวเลขด้วยตนเอง"
        showBack
      />

      <ReadingForm
        initialRoomId={roomId}
        initialDate={dateParam}
        initialMeterScope={initialScope}
        readingGroupId={readingGroupId}
        onSuccess={() => router.push("/overview/readings")}
      />
    </div>
  );
}
