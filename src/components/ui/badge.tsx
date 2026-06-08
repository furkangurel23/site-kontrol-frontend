import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeColor =
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "blue"
  | "slate";

const PALETTE: Record<BadgeColor, string> = {
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  blue: "bg-blue-100 text-blue-700",
  slate: "bg-slate-100 text-slate-700",
};

export interface BadgeProps {
  className?: string;
  children: React.ReactNode;
  color?: BadgeColor;
}

export const Badge = ({ className, children, color = "violet" }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      PALETTE[color],
      className
    )}
  >
    {children}
  </span>
);
