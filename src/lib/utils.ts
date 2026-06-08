import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const tl = (n: number | string | null | undefined) => {
  if (n === null || n === undefined || n === "") return "—";
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(v);
};

export const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("tr-TR"); } catch { return iso; }
};

export const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("tr-TR"); } catch { return iso; }
};

/**
 * Axios hatasından (veya benzer { response.data.message } şeklindeki yapıdan)
 * kullanıcıya gösterilebilir mesajı çekip döndürür. Yoksa undefined.
 */
export function extractApiError(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    return data?.message;
  }
  return undefined;
}
