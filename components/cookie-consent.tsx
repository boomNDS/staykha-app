"use client";

import { Link } from "@tanstack/react-router";
import * as React from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "staykha:cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setVisible(!stored);
  }, []);

  const handleChoice = (value: "accepted" | "rejected") => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="text-foreground font-medium">การใช้คุกกี้</p>
          <p>
            เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ใช้งานของคุณ คุณสามารถเลือกยอมรับหรือปฏิเสธได้
            อ่านเพิ่มเติมได้ที่{" "}
            <Link to="/terms" className="text-primary hover:underline">
              ข้อกำหนดและความเป็นส่วนตัว
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => handleChoice("rejected")}>
            ปฏิเสธ
          </Button>
          <Button onClick={() => handleChoice("accepted")}>ยอมรับ</Button>
        </div>
      </div>
    </div>
  );
}
