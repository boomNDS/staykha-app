"use client";

import { Building2, DoorOpen, User, Wrench } from "lucide-react";
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Room } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FloorPlanViewProps {
  rooms: Room[];
  buildingName: string;
  onRoomClick?: (room: Room) => void;
}

export function FloorPlanView({
  rooms,
  buildingName,
  onRoomClick,
}: FloorPlanViewProps) {
  // Group rooms by floor
  const roomsByFloor = React.useMemo(() => {
    const grouped = rooms.reduce(
      (acc, room) => {
        if (!acc[room.floor]) {
          acc[room.floor] = [];
        }
        acc[room.floor].push(room);
        return acc;
      },
      {} as Record<number, Room[]>,
    );

    // Sort floors in descending order (top floor first)
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([floor, roomsInFloor]) => ({
        floor: Number(floor),
        rooms: roomsInFloor.sort((a, b) =>
          a.roomNumber.localeCompare(b.roomNumber),
        ),
      }));
  }, [rooms]);

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "occupied":
        return "bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30";
      case "vacant":
        return "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30";
      case "maintenance":
        return "bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: Room["status"]) => {
    switch (status) {
      case "occupied":
        return <User className="h-5 w-5 text-emerald-600" />;
      case "vacant":
        return <DoorOpen className="h-5 w-5 text-blue-600" />;
      case "maintenance":
        return <Wrench className="h-5 w-5 text-amber-600" />;
    }
  };

  const statusLabels: Record<Room["status"], string> = {
    occupied: "Occupied",
    vacant: "Vacant",
    maintenance: "Maintenance",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="h-5 w-5" />
        <span className="text-sm font-medium">{buildingName}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500/30 border border-emerald-500/50" />
          <span className="text-sm text-muted-foreground">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-500/50" />
          <span className="text-sm text-muted-foreground">Vacant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500/30 border border-amber-500/50" />
          <span className="text-sm text-muted-foreground">Maintenance</span>
        </div>
      </div>

      {/* Floor plans */}
      <div className="space-y-8">
        {roomsByFloor.map(({ floor, rooms: floorRooms }) => (
          <div key={floor} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{`Floor ${floor}`}</h3>
              <span className="text-sm text-muted-foreground">
                {`(${floorRooms.filter((r) => r.status === "occupied").length}/${floorRooms.length} occupied)`}
              </span>
            </div>

            {/* Room grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <TooltipProvider>
                {floorRooms.map((room) => (
                  <Tooltip key={room.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onRoomClick?.(room)}
                        className={cn(
                          "relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg",
                          getStatusColor(room.status),
                          onRoomClick && "cursor-pointer",
                        )}
                      >
                        <div className="absolute top-2 right-2">
                          {getStatusIcon(room.status)}
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xl font-bold text-foreground">
                            {room.roomNumber}
                          </p>
                          {room.size && (
                            <p className="text-xs text-muted-foreground">
                              {room.size} m²
                            </p>
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{`Room ${room.roomNumber}`}</p>
                        <p className="text-sm">
                          Status:{" "}
                          <span className="capitalize">
                            {statusLabels[room.status]}
                          </span>
                        </p>
                        {room.size && (
                          <p className="text-sm">{`Size: ${room.size} m²`}</p>
                        )}
                        {room.monthlyRent && (
                          <p className="text-sm">
                            {`Rent: ฿${room.monthlyRent.toLocaleString()}/month`}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
