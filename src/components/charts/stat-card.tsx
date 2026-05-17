import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type Gradient = "brand" | "emerald" | "amber" | "violet" | "rose";
const grads: Record<Gradient, string> = {
  brand: "bg-gradient-brand",
  emerald: "bg-gradient-emerald",
  amber: "bg-gradient-amber",
  violet: "bg-gradient-violet",
  rose: "bg-gradient-rose",
};

export function StatCard({
  title, value, hint, icon: Icon, gradient = "brand",
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  gradient?: Gradient;
}) {
  return (
    <div className={cn("stat-card", grads[gradient])}>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-white/80">{title}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-white/80">{hint}</div>}
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 backdrop-blur">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
    </div>
  );
}
