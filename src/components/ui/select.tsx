import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Native `<select>` üzerine ince bir sarıcı.
 * Tüm sayfalarda kopyalanan "h-10 w-full rounded-xl border bg-background px-3 text-sm"
 * stilini tek noktada tutar; sağda küçük chevron ikonu gösterir.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "h-10 w-full appearance-none rounded-xl border border-input bg-background pl-3 pr-9 text-sm shadow-sm",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden
    />
  </div>
));
Select.displayName = "Select";
