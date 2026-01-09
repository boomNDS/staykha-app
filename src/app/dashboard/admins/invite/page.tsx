"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  usePageTitle("Invite Admin");

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
      toast.error("Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Invite Admin"
        description="Send an invitation to a new administrator."
        showBack
        backHref="/overview/admins"
      />

      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-muted p-4">
            <Mail className="h-5 w-5 text-primary" />
            <div className="text-sm text-muted-foreground">
              The admin will receive an email with an invitation code and
              instructions to access the system.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation..."
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3">
              <Button
                asChild
                type="button"
                variant="outline"
                className="flex-1 w-full bg-transparent"
              >
                <Link to="/overview/admins">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
