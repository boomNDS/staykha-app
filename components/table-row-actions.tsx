"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ActionItem = {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
};

interface TableRowActionsProps {
  primary?: ActionItem;
  items: ActionItem[];
  menuLabel?: string;
  className?: string;
}

export function TableRowActions({
  primary,
  items,
  menuLabel = "Actions",
  className,
}: TableRowActionsProps) {
  const hasMenu = items.length > 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {primary && (
        <Button
          variant="ghost"
          size="sm"
          onClick={primary.onClick}
          disabled={primary.disabled}
        >
          {primary.icon && <primary.icon className="mr-1 h-3.5 w-3.5" />}
          {primary.label}
        </Button>
      )}
      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items.map((item) => (
              <DropdownMenuItem
                key={item.label}
                onClick={item.onClick}
                disabled={item.disabled}
                variant={item.destructive ? "destructive" : "default"}
                className={item.className}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
