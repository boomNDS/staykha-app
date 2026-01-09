import * as React from "react";
import { cn } from "@/lib/utils";

type StayKhaLogoProps = {
  className?: string;
};

export function StayKhaLogo({ className }: StayKhaLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-6 w-6 text-current", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M16 8.5c-1.1-1-2.6-1.6-4.3-1.6-2.2 0-3.7 1-3.7 2.4 0 1.2 1 2 3 2.5 2 .5 3.5 1.2 3.5 2.8 0 1.6-1.7 2.9-4 2.9-1.8 0-3.4-.6-4.5-1.6" />
    </svg>
  );
}
