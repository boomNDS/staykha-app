"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Wand2 } from "lucide-react";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { SettingsRequired } from "@/components/settings-required";
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
import { useToast } from "@/hooks/use-toast";
import { buildingsApi, roomsApi, settingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import { bulkRoomSchema, mapZodErrors } from "@/lib/schemas";
import type { BulkRoomFormValues } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function BulkRoomPage() {
  usePageTitle("Bulk Add Rooms");

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingsApi.getAll(),
  });
  const settingsQuery = useQuery({
    queryKey: ["settings", user?.teamId],
    queryFn: () => {
      if (!user?.teamId) {
        throw new Error("Team ID is required to load settings");
      }
      return settingsApi.get(user.teamId);
    },
    enabled: !!user?.teamId,
  });
  const buildings = buildingsQuery.data?.buildings ?? [];

  const [formData, setFormData] = React.useState<BulkRoomFormValues>({
    buildingId: "",
    floorStart: "1",
    floorEnd: "1",
    roomsPerFloor: "6",
    startIndex: "1",
    status: "vacant",
    monthlyRent: "",
    size: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const settings = settingsQuery.data?.settings;
  
  // Show settings required message if settings don't exist
  if (settingsQuery.isSuccess && !settings) {
    return <SettingsRequired 
      title="Settings Required"
      description="You need to create settings for your team before you can bulk create rooms."
    />;
  }
  
  React.useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        monthlyRent:
          prev.monthlyRent ||
          String(settings.defaultRoomRent ?? ""),
        size:
          prev.size ||
          String(settings.defaultRoomSize ?? ""),
      }));
    }
  }, [settings]);

  const bulkCreateMutation = useMutation({
    mutationFn: (payload: {
      buildingId: string;
      floorStart: number;
      floorEnd: number;
      roomsPerFloor: number;
      startIndex: number;
      status: "occupied" | "vacant" | "maintenance";
      monthlyRent?: number;
      size?: number;
    }) => roomsApi.bulkCreate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const parsedFloorStart = Number.parseInt(formData.floorStart, 10);
  const parsedFloorEnd = Number.parseInt(formData.floorEnd, 10);
  const parsedRoomsPerFloor = Number.parseInt(formData.roomsPerFloor, 10);
  const parsedStartIndex = Number.parseInt(formData.startIndex, 10);
  const isPreviewValid =
    Number.isInteger(parsedFloorStart) &&
    Number.isInteger(parsedFloorEnd) &&
    Number.isInteger(parsedRoomsPerFloor) &&
    Number.isInteger(parsedStartIndex) &&
    parsedFloorEnd >= parsedFloorStart;
  const totalRooms = isPreviewValid
    ? (parsedFloorEnd - parsedFloorStart + 1) * parsedRoomsPerFloor
    : 0;
  const sampleRoom =
    isPreviewValid && totalRooms > 0
      ? `${parsedFloorStart}${String(parsedStartIndex).padStart(2, "0")}`
      : "—";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const result = bulkRoomSchema.safeParse(formData);
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      setIsSubmitting(false);
      return;
    }
    setErrors({});

    try {
      const response = await bulkCreateMutation.mutateAsync({
        buildingId: formData.buildingId,
        floorStart: Number.parseInt(formData.floorStart, 10),
        floorEnd: Number.parseInt(formData.floorEnd, 10),
        roomsPerFloor: Number.parseInt(formData.roomsPerFloor, 10),
        startIndex: Number.parseInt(formData.startIndex, 10),
        status: formData.status,
        monthlyRent: formData.monthlyRent
          ? Number.parseFloat(formData.monthlyRent)
          : undefined,
        size: formData.size ? Number.parseFloat(formData.size) : undefined,
      });
      toast({
        title: "Rooms created",
        description:
          response.skippedRooms.length > 0
            ? `Created ${response.createdCount} rooms. Skipped ${response.skippedRooms.length} duplicates.`
            : `Created ${response.createdCount} rooms.`,
      });
      router.push("/overview/rooms");
    } catch (error: any) {
      toast({
        title: "Bulk creation failed",
        description: error.message || "Could not create rooms.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Create Rooms"
        description="Generate rooms per floor with automatic numbering."
        showBack
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Room Generator</CardTitle>
            <CardDescription>
              Rooms will be created for every floor in the range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="buildingId">Building *</Label>
                  <Select
                    value={formData.buildingId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, buildingId: value })
                    }
                  >
                    <SelectTrigger
                      id="buildingId"
                      className={errors.buildingId ? "border-destructive" : ""}
                    >
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
                  <Label htmlFor="status">Default Status</Label>
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
                  <Label htmlFor="floorStart">Floor Start *</Label>
                  <Input
                    id="floorStart"
                    type="number"
                    min="1"
                    value={formData.floorStart}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        floorStart: event.target.value,
                      })
                    }
                    className={errors.floorStart ? "border-destructive" : ""}
                  />
                  {errors.floorStart && (
                    <p className="text-sm text-destructive">
                      {errors.floorStart}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floorEnd">Floor End *</Label>
                  <Input
                    id="floorEnd"
                    type="number"
                    min="1"
                    value={formData.floorEnd}
                    onChange={(event) =>
                      setFormData({ ...formData, floorEnd: event.target.value })
                    }
                    className={errors.floorEnd ? "border-destructive" : ""}
                  />
                  {errors.floorEnd && (
                    <p className="text-sm text-destructive">
                      {errors.floorEnd}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomsPerFloor">Rooms per Floor *</Label>
                  <Input
                    id="roomsPerFloor"
                    type="number"
                    min="1"
                    value={formData.roomsPerFloor}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        roomsPerFloor: event.target.value,
                      })
                    }
                    className={errors.roomsPerFloor ? "border-destructive" : ""}
                  />
                  {errors.roomsPerFloor && (
                    <p className="text-sm text-destructive">
                      {errors.roomsPerFloor}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startIndex">Room Start Index *</Label>
                  <Input
                    id="startIndex"
                    type="number"
                    min="1"
                    value={formData.startIndex}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        startIndex: event.target.value,
                      })
                    }
                    className={errors.startIndex ? "border-destructive" : ""}
                  />
                  {errors.startIndex && (
                    <p className="text-sm text-destructive">
                      {errors.startIndex}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Room Size (sqm)</Label>
                  <Input
                    id="size"
                    type="number"
                    min="0"
                    value={formData.size}
                    onChange={(event) =>
                      setFormData({ ...formData, size: event.target.value })
                    }
                    className={errors.size ? "border-destructive" : ""}
                  />
                  {errors.size && (
                    <p className="text-sm text-destructive">{errors.size}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent (THB)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    min="0"
                    value={formData.monthlyRent}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        monthlyRent: event.target.value,
                      })
                    }
                    className={errors.monthlyRent ? "border-destructive" : ""}
                  />
                  {errors.monthlyRent && (
                    <p className="text-sm text-destructive">
                      {errors.monthlyRent}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Generate Rooms"}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              Preview
            </CardTitle>
            <CardDescription>Quick check before creation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                Total rooms to be created
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {totalRooms}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                Sample room number
              </p>
              <p className="mt-2 font-semibold text-foreground">{sampleRoom}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Format: floor + two-digit index (e.g., 201, 202, 203)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
