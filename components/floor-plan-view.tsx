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
        return "bg-slate-400/20 border-slate-400/50 hover:bg-slate-400/30";
      case "vacant":
        return "bg-slate-300/25 border-slate-300/50 hover:bg-slate-300/35";
      case "maintenance":
        return "bg-slate-500/15 border-slate-500/40 hover:bg-slate-500/20";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: Room["status"]) => {
    switch (status) {
      case "occupied":
        return <User className="h-5 w-5 text-slate-600" />;
      case "vacant":
        return <DoorOpen className="h-5 w-5 text-slate-500" />;
      case "maintenance":
        return <Wrench className="h-5 w-5 text-slate-600" />;
    }
  };

  const statusLabels: Record<Room["status"], string> = {
    occupied: "มีผู้เช่า",
    vacant: "ว่าง",
    maintenance: "ซ่อมบำรุง",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="h-5 w-5" />
        <span className="text-sm font-medium">{buildingName}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 rounded-lg bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-400/30 border border-slate-400/50" />
          <span className="text-sm text-muted-foreground">มีผู้เช่า</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-300/40 border border-slate-300/50" />
          <span className="text-sm text-muted-foreground">ว่าง</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-500/20 border border-slate-500/40" />
          <span className="text-sm text-muted-foreground">ซ่อมบำรุง</span>
        </div>
      </div>

      {/* Floor plans */}
      <div className="space-y-8">
        {roomsByFloor.map(({ floor, rooms: floorRooms }) => (
          <div key={floor} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{`ชั้น ${floor}`}</h3>
              <span className="text-sm text-muted-foreground">
                {`(${floorRooms.filter((r) => r.status === "occupied").length}/${floorRooms.length} ห้องมีผู้เช่า)`}
              </span>
            </div>

            {/* Room grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <TooltipProvider>
                {floorRooms.map((room) => (
                  <Tooltip key={room.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onRoomClick?.(room)}
                        className={cn(
                          "relative flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-lg",
                          getStatusColor(room.status),
                          onRoomClick && "cursor-pointer",
                        )}
                        aria-label={`ห้อง ${room.roomNumber} - ${statusLabels[room.status]}`}
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
                              {room.size} ตร.ม.
                            </p>
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{`ห้อง ${room.roomNumber}`}</p>
                        <p className="text-sm">
                          สถานะ:{" "}
                          <span className="capitalize">
                            {statusLabels[room.status]}
                          </span>
                        </p>
                        {room.size && (
                          <p className="text-sm">{`ขนาด: ${room.size} ตร.ม.`}</p>
                        )}
                        {room.monthlyRent && (
                          <p className="text-sm">
                            {`ค่าเช่า: ฿${room.monthlyRent.toLocaleString()}/เดือน`}
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
