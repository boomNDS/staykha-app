"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
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
import { roomsApi, tenantsApi } from "@/lib/api-client";
import { useRouter } from "@/lib/router";
import { mapZodErrors, tenantFormSchema } from "@/lib/schemas";
import type { Room } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function NewTenantPage() {
  usePageTitle("New Tenant");

  const router = useRouter();
  const queryClient = useQueryClient();
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const rooms = (roomsQuery.data?.rooms ?? []).filter(
    (room: Room) => room.status === "vacant",
  );
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    roomId: "",
    moveInDate: new Date().toISOString().split("T")[0],
    contractEndDate: "",
    monthlyRent: "",
    deposit: "",
    idCardNumber: "",
    emergencyContact: "",
    emergencyPhone: "",
    status: "active",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const createTenantMutation = useMutation({
    mutationFn: (payload: typeof formData) =>
      tenantsApi.create({
        ...payload,
        monthlyRent: Number.parseFloat(payload.monthlyRent || "0"),
        deposit: Number.parseFloat(payload.deposit || "0"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = tenantFormSchema.safeParse(formData);
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await createTenantMutation.mutateAsync(formData);
      router.push("/overview/tenants");
    } catch (error) {
      console.error("Failed to create tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Tenant"
        description="Enter tenant information and assign a room."
        showBack
      />

      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
          <CardDescription>
            Fill in the details for the new tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="081-234-5678"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId">Assign Room *</Label>
                <Select
                  value={formData.roomId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, roomId: value })
                  }
                >
                  <SelectTrigger
                    id="roomId"
                    className={errors.roomId ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.roomNumber} - {room.buildingName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roomId && (
                  <p className="text-sm text-destructive">{errors.roomId}</p>
                )}
                <Button asChild variant="link" className="px-0 text-sm">
                  <Link to="/overview/rooms/new">Create a room instead</Link>
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moveInDate">Move-in Date *</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  required
                  value={formData.moveInDate}
                  onChange={(e) =>
                    setFormData({ ...formData, moveInDate: e.target.value })
                  }
                  className={errors.moveInDate ? "border-destructive" : ""}
                />
                {errors.moveInDate && (
                  <p className="text-sm text-destructive">
                    {errors.moveInDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractEndDate">Contract End Date</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contractEndDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rent (THB)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyRent: e.target.value })
                  }
                  placeholder="0.00"
                  className={errors.monthlyRent ? "border-destructive" : ""}
                />
                {errors.monthlyRent && (
                  <p className="text-sm text-destructive">
                    {errors.monthlyRent}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">Security Deposit (THB)</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.deposit}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit: e.target.value })
                  }
                  placeholder="0.00"
                  className={errors.deposit ? "border-destructive" : ""}
                />
                {errors.deposit && (
                  <p className="text-sm text-destructive">{errors.deposit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCardNumber">ID Card Number</Label>
                <Input
                  id="idCardNumber"
                  value={formData.idCardNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, idCardNumber: e.target.value })
                  }
                  placeholder="1-2345-67890-12-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: e.target.value,
                    })
                  }
                  placeholder="Contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyPhone: e.target.value })
                  }
                  placeholder="081-234-5678"
                />
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Tenant"}
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
