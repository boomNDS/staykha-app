"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BankOption = {
  value: string;
  label: string;
  short: string;
  className: string;
  logo?: string;
  logoBgClass?: string;
};

export const BANK_OPTIONS: BankOption[] = [
  {
    value: "ธนาคารกสิกรไทย",
    label: "ธนาคารกสิกรไทย",
    short: "KB",
    className: "bg-emerald-600 text-white",
    logo: "kbank.svg",
    logoBgClass: "bg-emerald-600",
  },
  {
    value: "ธนาคารกรุงไทย",
    label: "ธนาคารกรุงไทย",
    short: "KTB",
    className: "bg-blue-600 text-white",
    logo: "ktb.svg",
    logoBgClass: "bg-blue-600",
  },
  {
    value: "ธนาคารกรุงเทพ",
    label: "ธนาคารกรุงเทพ",
    short: "BBL",
    className: "bg-indigo-700 text-white",
    logo: "bbl.svg",
    logoBgClass: "bg-indigo-700",
  },
  {
    value: "ธนาคารไทยพาณิชย์",
    label: "ธนาคารไทยพาณิชย์",
    short: "SCB",
    className: "bg-violet-600 text-white",
    logo: "scb.svg",
    logoBgClass: "bg-violet-600",
  },
  {
    value: "ธนาคารกรุงศรีอยุธยา",
    label: "ธนาคารกรุงศรีอยุธยา",
    short: "BAY",
    className: "bg-amber-500 text-white",
    logo: "bay.svg",
    logoBgClass: "bg-amber-500",
  },
  {
    value: "ธนาคารทหารไทยธนชาต",
    label: "ธนาคารทหารไทยธนชาต",
    short: "TTB",
    className: "bg-sky-500 text-white",
    logo: "ttb.svg",
    logoBgClass: "bg-sky-500",
  },
  {
    value: "ธนาคารออมสิน",
    label: "ธนาคารออมสิน",
    short: "GSB",
    className: "bg-pink-500 text-white",
    logo: "gsb.svg",
    logoBgClass: "bg-pink-500",
  },
  {
    value: "ธนาคารเกียรตินาคินภัทร",
    label: "ธนาคารเกียรตินาคินภัทร",
    short: "KKP",
    className: "bg-rose-700 text-white",
    logoBgClass: "bg-rose-700",
  },
];

export const getBankOption = (name?: string | null) =>
  BANK_OPTIONS.find((bank) => bank.value === name) ?? null;

type BankLogoProps = {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function BankLogo({ name, size = "md", className }: BankLogoProps) {
  const bank = getBankOption(name);
  if (!bank) return null;
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  } as const;

  if (bank.logo && !imageError) {
    const logoSize = size === "sm" ? 20 : size === "md" ? 28 : 38;
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg",
          bank.logoBgClass ?? "bg-muted/60",
          className,
          sizeClasses[size],
        )}
        aria-label={`โลโก้ ${bank.label}`}
      >
        <img
          src={`/banks/${bank.logo}`}
          alt=""
          width={logoSize}
          height={logoSize}
          className={cn(
            "object-contain",
            size === "sm" && "h-5 w-5",
            size === "md" && "h-7 w-7",
            size === "lg" && "h-10 w-10",
          )}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold tracking-tight shadow-sm",
        bank.className,
        sizeClasses[size],
        className,
      )}
      aria-label={`โลโก้ ${bank.label}`}
    >
      {bank.short}
    </span>
  );
}
