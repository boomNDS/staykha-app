"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@/lib/router";

interface SettingsRequiredProps {
  title?: string;
  description?: string;
}

export function SettingsRequired({
  title = "ต้องตั้งค่า Settings ก่อนใช้งาน",
  description = "คุณต้องสร้าง Settings ของทีมก่อนจึงจะใช้ฟีเจอร์นี้ได้",
}: SettingsRequiredProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-muted-foreground" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            คลิกปุ่มด้านล่างเพื่อไปที่ Settings และสร้างค่าเริ่มต้นสำหรับทีมของคุณ
          </p>
          <Button
            onClick={() => router.push("/overview/settings")}
            className="w-full"
          >
            <Settings className="mr-2 h-4 w-4" />
            ไปที่ Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
