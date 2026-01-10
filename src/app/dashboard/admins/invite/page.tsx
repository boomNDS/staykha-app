"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Mail, Send } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { invitationsApi } from "@/lib/api-client";
import { useRouter } from "@/lib/router";
import { usePageTitle } from "@/lib/use-page-title";

export default function InviteAdminPage() {
  usePageTitle("เชิญผู้ดูแล");

  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createInvitationMutation = useMutation({
    mutationFn: (payload: { email: string; name: string; message?: string }) =>
      invitationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createInvitationMutation.mutateAsync(formData);
      router.push("/overview/admins");
    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast.error("ส่งคำเชิญไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="เชิญผู้ดูแล"
        description="ส่งคำเชิญไปยังผู้ดูแลคนใหม่"
        showBack
        backHref="/overview/admins"
      />

      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-muted p-4">
            <Mail className="h-5 w-5 text-primary" />
            <div className="text-sm text-muted-foreground">
              ผู้ดูแลจะได้รับอีเมลพร้อมโค้ดเชิญและขั้นตอนการเข้าระบบ
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
              <Input
                id="name"
                type="text"
                placeholder="สมชาย ใจดี"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">ข้อความเพิ่มเติม (ไม่บังคับ)</Label>
              <Textarea
                id="message"
                placeholder="เพิ่มข้อความถึงผู้รับคำเชิญ..."
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3">
              <Button
                asChild
                type="button"
                variant="outline"
                className="flex-1 w-full bg-transparent"
                disabled={isSubmitting}
              >
                <Link to="/overview/admins">ยกเลิก</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "กำลังส่ง..." : "ส่งคำเชิญ"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
