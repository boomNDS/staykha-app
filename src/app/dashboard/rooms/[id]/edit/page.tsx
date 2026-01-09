"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { TenantInlineForm } from "@/components/rooms/tenant-inline-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildingsApi, roomsApi, tenantsApi } from "@/lib/api-client";
import { useParams, useRouter } from "@/lib/router";
import { mapZodErrors, roomFormSchema, tenantDraftSchema } from "@/lib/schemas";
import type { RoomFormValues, TenantDraft } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function EditRoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  usePageTitle(`Edit Room ${roomId}`);

  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<RoomFormValues>({
    roomNumber: "",
    buildingId: "",
    floor: "1",
    status: "vacant",
    monthlyRent: "",
    size: "",
  });
  const [assignTenantNow, setAssignTenantNow] = React.useState(false);
  const [tenantData, setTenantData] = React.useState<TenantDraft>({
    name: "",
    email: "",
    phone: "",
    moveInDate: new Date().toISOString().split("T")[0],
    deposit: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [tenantErrors, setTenantErrors] = React.useState<
    Record<string, string>
  >({});

  const roomQuery = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => roomsApi.getById(roomId),
    enabled: Boolean(roomId),
  });
  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingsApi.getAll(),
  });
  const buildings = buildingsQuery.data?.buildings ?? [];

  React.useEffect(() => {
    if (roomQuery.data?.room) {
      const room = roomQuery.data.room;
      setFormData({
        roomNumber: room.roomNumber,
        buildingId: room.buildingId,
        floor: String(room.floor),
        status: room.status,
        monthlyRent: room.monthlyRent ? String(room.monthlyRent) : "",
        size: room.size ? String(room.size) : "",
      });
    }
  }, [roomQuery.data]);

  const updateRoomMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      updates: {
        roomNumber: string;
        buildingId: string;
        floor: number;
        status: string;
      };
    }) => roomsApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
  const createTenantMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      phone: string;
      moveInDate: string;
      deposit: number;
      roomId: string;
      monthlyRent: number;
      status: "active";
    }) => tenantsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  if (roomQuery.isLoading || buildingsQuery.isLoading) {
    return <LoadingState fullScreen message="Loading room..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roomResult = roomFormSchema.safeParse(formData);
      if (!roomResult.success) {
        setErrors(mapZodErrors(roomResult.error));
        setTenantErrors({});
        setLoading(false);
        return;
      }
      if (assignTenantNow) {
        const tenantResult = tenantDraftSchema.safeParse(tenantData);
        if (!tenantResult.success) {
          setTenantErrors(mapZodErrors(tenantResult.error));
          setLoading(false);
          return;
        }
      }
      setErrors({});
      setTenantErrors({});

      await updateRoomMutation.mutateAsync({
        id: roomId,
        updates: {
          roomNumber: formData.roomNumber,
          buildingId: formData.buildingId,
          floor: Number.parseInt(formData.floor, 10),
          status: formData.status,
          monthlyRent: formData.monthlyRent
            ? Number.parseFloat(formData.monthlyRent)
            : undefined,
          size: formData.size ? Number.parseFloat(formData.size) : undefined,
        },
      });
      if (assignTenantNow && roomQuery.data?.room?.status !== "occupied") {
        await createTenantMutation.mutateAsync({
          name: tenantData.name,
          email: tenantData.email,
          phone: tenantData.phone,
          moveInDate: tenantData.moveInDate,
          deposit: tenantData.deposit
            ? Number.parseFloat(tenantData.deposit)
            : 0,
          roomId,
          monthlyRent: formData.monthlyRent
            ? Number.parseFloat(formData.monthlyRent)
            : 0,
          status: "active",
        });
      }
      router.push("/overview/rooms");
    } catch (error) {
      console.error("Failed to update room:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Room"
        description="Update room information."
        showBack
      />

      <Card>
        <CardHeader>
          <CardTitle>Room Information</CardTitle>
          <CardDescription>Update the room details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number *</Label>
                <Input
                  id="roomNumber"
                  required
                  value={formData.roomNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, roomNumber: e.target.value })
                  }
                />
                {errors.roomNumber && (
                  <p className="text-sm text-destructive">
                    {errors.roomNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingName">Building *</Label>
                <Select
                  value={formData.buildingId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, buildingId: value })
                  }
                >
                  <SelectTrigger id="buildingName">
                    <SelectValue placeholder="Select a building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.buildingId && (
                  <p className="text-sm text-destructive">
                    {errors.buildingId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Floor *</Label>
                <Input
                  id="floor"
                  type="number"
                  required
                  min="1"
                  value={formData.floor}
                  onChange={(e) =>
                    setFormData({ ...formData, floor: e.target.value })
                  }
                />
                {errors.floor && (
                  <p className="text-sm text-destructive">{errors.floor}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Room Size (sqm)</Label>
                <Input
                  id="size"
                  type="number"
                  min="0"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                />
                {errors.size && (
                  <p className="text-sm text-destructive">{errors.size}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rent</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  min="0"
                  value={formData.monthlyRent}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyRent: e.target.value })
                  }
                />
                {errors.monthlyRent && (
                  <p className="text-sm text-destructive">
                    {errors.monthlyRent}
                  </p>
                )}
              </div>
            </div>

            {roomQuery.data?.room?.status !== "occupied" && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Assign tenant now
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Create a tenant and link them to this room.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={assignTenantNow ? "default" : "outline"}
                    onClick={() => setAssignTenantNow((prev) => !prev)}
                  >
                    {assignTenantNow ? "Enabled" : "Add Tenant"}
                  </Button>
                </div>
                {assignTenantNow && (
                  <TenantInlineForm
                    value={tenantData}
                    onChange={setTenantData}
                    showDeposit
                    errors={tenantErrors}
                  />
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Room"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
