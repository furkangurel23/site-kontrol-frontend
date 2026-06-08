import * as React from "react";
import { Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Form alanı sarıcı: <Label> + kontrol + opsiyonel hata mesajı.
 * Dialoglarda kopyalanan `<div className="space-y-1"><Label>...` boilerplate'ini ortadan kaldırır.
 */
export function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
