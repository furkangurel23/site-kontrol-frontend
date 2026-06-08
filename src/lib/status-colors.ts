/**
 * Backend enum'larından gelen statü/öncelik değerleri için merkezi renk haritası.
 *
 * Aynı kavramı farklı sayfalarda hep aynı renkle göstermek için tüm
 * `<Badge color="...">` ve hardcoded `text-rose-600` benzeri kullanımlar
 * buradaki sabitlere çekilmiştir.
 */

import type { BadgeColor } from "@/components/ui/badge";

/** Aidat tahakkuk durumu (com.sitekontrol.dues.ChargeStatus). */
export const CHARGE_STATUS_COLORS: Record<string, BadgeColor> = {
  ODENDI: "emerald",
  BEKLEMEDE: "slate",
  KISMI: "amber",
  GECIKMIS: "rose",
};

/** Arıza/Talep durumu (com.sitekontrol.complaint.ComplaintStatus). */
export const COMPLAINT_STATUS_COLORS: Record<string, BadgeColor> = {
  ACIK: "rose",
  ISLEMDE: "amber",
  BEKLIYOR: "blue",
  KAPALI: "emerald",
};

/** Talep önceliği (com.sitekontrol.complaint.Priority). */
export const PRIORITY_COLORS: Record<string, BadgeColor> = {
  DUSUK: "slate",
  NORMAL: "slate",
  YUKSEK: "amber",
  ACIL: "rose",
};

/** Duyuru kategorisi (com.sitekontrol.announcement.AnnouncementCategory). */
export const ANNOUNCEMENT_CATEGORY_COLORS: Record<string, BadgeColor> = {
  GENEL: "violet",
  BAKIM: "blue",
  TOPLANTI: "amber",
  ACIL: "rose",
  MALI: "emerald",
};

/** Sakin tipi (MALIK / KIRACI). */
export const RESIDENT_TYPE_COLORS: Record<string, BadgeColor> = {
  MALIK: "violet",
  KIRACI: "amber",
};

/** Kullanıcı rolü. */
export const ROLE_COLORS: Record<string, BadgeColor> = {
  SUPER_ADMIN: "violet",
  YONETICI: "emerald",
  YARDIMCI: "amber",
  DENETCI: "blue",
  SAKIN: "slate",
};

/** Sayısal bakiye için sınıf — pozitif borç kırmızı, ödenmiş yeşil, sıfır nötr. */
export function balanceTextClass(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(value) || value === 0) return "text-muted-foreground";
  return value > 0 ? "text-rose-600" : "text-emerald-600";
}
