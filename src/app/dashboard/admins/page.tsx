"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Mail, Shield, Trash2, UserCog, UserX } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { TableRowActions } from "@/components/table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { adminsApi, invitationsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { AdminInvitation, User } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatDate } from "@/lib/utils";

export default function AdminsPage() {
  usePageTitle("ผู้ดูแลระบบ");

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminsQuery = useQuery({
    queryKey: ["admins", user?.teamId],
    queryFn: () => adminsApi.getAll(user?.teamId),
    enabled: !!user?.teamId,
  });
  const invitationsQuery = useQuery({
    queryKey: ["invitations", user?.teamId],
    queryFn: () => invitationsApi.getAll(user?.teamId),
    enabled: !!user?.teamId,
  });
  const admins = adminsQuery.data?.admins ?? [];
  const invitations = invitationsQuery.data?.invitations ?? [];
  const isLoading = adminsQuery.isLoading || invitationsQuery.isLoading;
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm?: () => void;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (id: string) => adminsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: "ลบผู้ดูแลหรือไม่?",
      description: "ผู้ดูแลรายนี้จะถูกตัดสิทธิ์ทันที",
      confirmLabel: "ลบ",
      cancelLabel: "ยกเลิก",
      onConfirm: async () => {
        try {
          await deleteAdminMutation.mutateAsync(id);
        } catch (error) {
          console.error("Failed to delete admin:", error);
        }
      },
    });
  };

  const handleRevokeInvitation = (id: string) => {
    setConfirmState({
      open: true,
      title: "เพิกถอนคำเชิญหรือไม่?",
      description: "ผู้ที่ถูกเชิญจะไม่สามารถเข้าร่วมได้อีก",
      confirmLabel: "เพิกถอน",
      cancelLabel: "ยกเลิก",
      onConfirm: async () => {
        try {
          await revokeInvitationMutation.mutateAsync(id);
        } catch (error) {
          console.error("Failed to revoke invitation:", error);
        }
      },
    });
  };

  const adminColumns = [
    {
      key: "name",
      header: "ชื่อ",
      searchable: true,
      render: (admin: User) => (
        <span className="font-medium text-foreground">{admin.name}</span>
      ),
    },
    {
      key: "email",
      header: "อีเมล",
      searchable: true,
      render: (admin: User) => (
        <span className="text-muted-foreground">{admin.email}</span>
      ),
    },
    {
      key: "createdAt",
      header: "วันที่เข้าร่วม",
      render: (admin: User) => (
        <span className="text-muted-foreground">
          {formatDate(admin.createdAt || "")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (admin: User) => (
        <TableRowActions
          items={[
            {
              label: "ลบผู้ดูแล",
              icon: UserX,
              destructive: true,
              disabled: admin.id === user?.id,
              onClick: () => handleDelete(admin.id),
            },
          ]}
        />
      ),
    },
  ];

  const invitationColumns = [
    {
      key: "email",
      header: "อีเมล",
      searchable: true,
      render: (invitation: AdminInvitation) => (
        <span className="font-medium text-foreground">{invitation.email}</span>
      ),
    },
    {
      key: "inviteCode",
      header: "โค้ดเชิญ",
      render: (invitation: AdminInvitation) => (
        <span className="font-mono text-sm text-muted-foreground">
          {invitation.inviteCode}
        </span>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (invitation: AdminInvitation) => (
        <Badge
          variant={
            invitation.status === "accepted"
              ? "default"
              : invitation.status === "expired"
                ? "secondary"
                : "outline"
          }
        >
          {invitation.status === "accepted"
            ? "ตอบรับแล้ว"
            : invitation.status === "expired"
              ? "หมดอายุ"
              : "รอดำเนินการ"}
        </Badge>
      ),
    },
    {
      key: "expiresAt",
      header: "หมดอายุ",
      render: (invitation: AdminInvitation) => (
        <span className="text-muted-foreground">
          {formatDate(invitation.expiresAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (invitation: AdminInvitation) => (
        <TableRowActions
          items={[
            {
              label: "เพิกถอนคำเชิญ",
              icon: Trash2,
              destructive: true,
              onClick: () => handleRevokeInvitation(invitation.id),
            },
          ]}
        />
      ),
    },
  ];

  if (isLoading) {
    return <LoadingState fullScreen message="กำลังโหลดผู้ดูแล..." />;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="จัดการผู้ดูแลระบบ"
        description="จัดการผู้ดูแลระบบและคำเชิญ"
        actions={
          <Button asChild className="gap-2">
            <Link to="/overview/admins/invite">
              <Mail className="h-4 w-4" />
              เชิญผู้ดูแล
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">ผู้ดูแลที่ใช้งานอยู่</h2>
              <Badge variant="secondary">{admins.length}</Badge>
            </div>
          </div>
          <div className="p-4">
            {admins.length > 0 ? (
              <DataTable
                columns={adminColumns}
                data={admins}
                hideSearch={false}
                searchPlaceholder="ค้นหาผู้ดูแล..."
                forcePagination
              />
            ) : (
              <EmptyState
                icon={<UserCog className="h-8 w-8 text-muted-foreground" />}
                title="ยังไม่มีผู้ดูแล"
                description="เชิญผู้ดูแลคนแรกเพื่อช่วยจัดการระบบ"
                action={
                  <Button asChild>
                    <Link to="/overview/admins/invite">เชิญผู้ดูแล</Link>
                  </Button>
                }
              />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">คำเชิญที่รออยู่</h2>
              <Badge variant="outline">{invitations.length}</Badge>
            </div>
          </div>
          <div className="p-4">
            {invitations.length > 0 ? (
              <DataTable
                columns={invitationColumns}
                data={invitations}
                hideSearch={false}
                searchPlaceholder="ค้นหาคำเชิญ..."
                forcePagination
              />
            ) : (
              <EmptyState
                icon={<Mail className="h-8 w-8 text-muted-foreground" />}
                title="ไม่มีคำเชิญค้างอยู่"
                description="คำเชิญทั้งหมดถูกตอบรับหรือหมดอายุแล้ว"
              />
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="ยืนยัน"
        onConfirm={() => {
          const action = confirmState.onConfirm;
          setConfirmState((prev) => ({ ...prev, open: false }));
          action?.();
        }}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}
