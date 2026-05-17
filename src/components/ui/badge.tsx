import { cn } from "@/lib/utils";
import * as React from "react";

export const Badge = ({ className, children, color = "violet" }:
  { className?: string; children: React.ReactNode; color?: "violet" | "emerald" | "amber" | "rose" | "blue" | "slate" }) => {
  const palette: Record<string, string> = {
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    blue: "bg-blue-100 text-blue-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      palette[color], className)}>
      {children}
    </span>
  );
};
