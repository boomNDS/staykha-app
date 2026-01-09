"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { LoadingState } from "@/components/loading-state";
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
import { useToast } from "@/hooks/use-toast";
import { buildingsApi } from "@/lib/api-client";
import { useParams, useRouter } from "@/lib/router";
import type { Building } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function EditBuildingPage() {
  const params = useParams();
  const buildingId = params.id as string;
  usePageTitle(`Edit Building ${buildingId}`);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    totalFloors: "",
    totalRooms: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const buildingQuery = useQuery({
    queryKey: ["buildings", buildingId],
    queryFn: () => buildingsApi.getById(buildingId),
    enabled: Boolean(buildingId),
  });

  React.useEffect(() => {
    if (buildingQuery.data?.building) {
      const building: Building = buildingQuery.data.building;
      setFormData({
        name: building.name,
        address: building.address,
        totalFloors: building.totalFloors.toString(),
        totalRooms: building.totalRooms.toString(),
      });
    }
  }, [buildingQuery.data]);

  const updateBuildingMutation = useMutation({
    mutationFn: (payload: { id: string; updates: Partial<Building> }) =>
      buildingsApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Building name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (
      !formData.totalFloors ||
      Number.parseInt(formData.totalFloors, 10) < 1
    ) {
      newErrors.totalFloors = "Must be at least 1 floor";
    }
    if (!formData.totalRooms || Number.parseInt(formData.totalRooms, 10) < 1) {
      newErrors.totalRooms = "Must be at least 1 room";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await updateBuildingMutation.mutateAsync({
        id: buildingId,
        updates: {
          ...formData,
          totalFloors: Number.parseInt(formData.totalFloors, 10),
          totalRooms: Number.parseInt(formData.totalRooms, 10),
        },
      });

      toast({
        title: "Success",
        description: "Building updated successfully",
      });

      router.push("/overview/buildings");
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update building",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (buildingQuery.isLoading) {
    return <LoadingState fullScreen message="Loading building..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Building"
        description="Update building information."
        showBack
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Building Information</CardTitle>
          <CardDescription>
            Modify the details for this building
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Building Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Building A"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                placeholder="e.g., 123 Sukhumvit Road, Bangkok 10110"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                disabled={isLoading}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="totalFloors" className="text-sm font-medium">
                  Total Floors
                </label>
                <Input
                  id="totalFloors"
                  type="number"
                  min="1"
                  placeholder="e.g., 3"
                  value={formData.totalFloors}
                  onChange={(e) =>
                    setFormData({ ...formData, totalFloors: e.target.value })
                  }
                  disabled={isLoading}
                />
                {errors.totalFloors && (
                  <p className="text-sm text-destructive">
                    {errors.totalFloors}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="totalRooms" className="text-sm font-medium">
                  Total Rooms
                </label>
                <Input
                  id="totalRooms"
                  type="number"
                  min="1"
                  placeholder="e.g., 15"
                  value={formData.totalRooms}
                  onChange={(e) =>
                    setFormData({ ...formData, totalRooms: e.target.value })
                  }
                  disabled={isLoading}
                />
                {errors.totalRooms && (
                  <p className="text-sm text-destructive">
                    {errors.totalRooms}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Building"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
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
