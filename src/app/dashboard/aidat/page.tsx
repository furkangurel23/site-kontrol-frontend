"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, FileSpreadsheet } from "lucide-react";

import { api } from "@/lib/api";
import { tl, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Empty } from "@/components/ui/empty";
import { isAdminRole, useAuthStore } from "@/stores/auth";

type Plan = {
  id: number; name: string; periodYear: number; periodMonth?: number; amount: number;
  type: string; dueDate: string; distribution: string; description?: string;
  totalCharged?: number; totalPaid?: number;
};

const statusColors: Record<string, "emerald" | "rose" | "amber" | "slate"> = {
  ODENDI: "emerald", BEKLEMEDE: "slate", KISMI: "amber", GECIKMIS: "rose",
};

export default function AidatPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore.getState().user?.role);
  const [openPlan, setOpenPlan] = useState(false);
  const [openPayment, setOpenPayment] = useState<number | null>(null);

  const plans = useQuery({
    queryKey: ["dues", "plans"],
    queryFn: async () => (await api.get("/api/dues/plans", { params: { page: 0, size: 24 } })).data.content as Plan[],
  });

  const outstanding = useQuery({
    queryKey: ["dues", "outstanding"],
    queryFn: async () => (await api.get("/api/dues/charges/outstanding", { params: { page: 0, size: 100 } })).data.content,
  });

  const planForm = useForm({
    defaultValues: {
      name: "", periodYear: new Date().getFullYear(), periodMonth: new Date().getMonth() + 1,
      amount: 500, type: "DUZENLI", dueDate: new Date().toISOString().slice(0, 10),
      distribution: "ESIT", description: "",
    },
  });

  const createPlan = useMutation({
    mutationFn: async (data: any) => (await api.post("/api/dues/plans", data)).data,
    onSuccess: () => {
      toast.success("Aidat planı oluşturuldu ve tahakkuklar üretildi.");
      qc.invalidateQueries({ queryKey: ["dues"] });
      setOpenPlan(false);
      planForm.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Hata"),
  });

  const paymentForm = useForm({
    defaultValues: { amount: 0, paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: "HAVALE", reference: "", notes: "" },
  });

  const pay = useMutation({
    mutationFn: async ({ chargeId, data }: { chargeId: number; data: any }) =>
      (await api.post("/api/dues/payments", { ...data, chargeId })).data,
    onSuccess: () => {
      toast.success("Ödeme kaydedildi");
      qc.invalidateQueries({ queryKey: ["dues"] });
      setOpenPayment(null);
      paymentForm.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Hata"),
  });

  const downloadExcel = async () => {
    const res = await api.get("/api/reports/dues.xlsx", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = "aidat-raporu.xlsx"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Aidat</h1>
          <p className="text-sm text-muted-foreground">Plan, tahakkuk ve ödeme takibi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel}>
            <FileSpreadsheet className="h-4 w-4" /> Excel İndir
          </Button>
          {isAdmin && (
            <Dialog open={openPlan} onOpenChange={setOpenPlan}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" /> Yeni Plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yeni Aidat Planı</DialogTitle></DialogHeader>
                <form onSubmit={planForm.handleSubmit((d) => createPlan.mutate(d))} className="grid gap-3">
                  <div>
                    <Label>Plan Adı</Label>
                    <Input {...planForm.register("name", { required: true })} placeholder="2026 Mayıs Aidat" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Yıl</Label><Input type="number" {...planForm.register("periodYear", { valueAsNumber: true })} /></div>
                    <div><Label>Ay</Label><Input type="number" min={1} max={12} {...planForm.register("periodMonth", { valueAsNumber: true })} /></div>
                    <div><Label>Tutar (₺)</Label><Input type="number" step="0.01" {...planForm.register("amount", { valueAsNumber: true })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tip</Label>
                      <select {...planForm.register("type")} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                        <option value="DUZENLI">Düzenli</option>
                        <option value="EK">Ek Aidat</option>
                        <option value="DEMIRBAS">Demirbaş</option>
                      </select>
                    </div>
                    <div>
                      <Label>Dağılım</Label>
                      <select {...planForm.register("distribution")} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                        <option value="ESIT">Eşit</option>
                        <option value="ARSA_PAYI">Arsa Payı</option>
                      </select>
                    </div>
                  </div>
                  <div><Label>Son Ödeme Tarihi</Label><Input type="date" {...planForm.register("dueDate")} /></div>
                  <div><Label>Açıklama</Label><Textarea {...planForm.register("description")} /></div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpenPlan(false)}>Vazgeç</Button>
                    <Button type="submit" disabled={createPlan.isPending}>
                      {createPlan.isPending ? "Oluşturuluyor…" : "Oluştur"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Planlar</CardTitle></CardHeader>
        <CardContent>
          {(plans.data ?? []).length === 0 ? <Empty title="Plan yok" subtitle="Yeni aidat planı ekleyin." /> : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(plans.data ?? []).map((p) => {
                const collected = p.totalPaid ?? 0;
                const charged = p.totalCharged ?? 0;
                const pct = charged > 0 ? Math.min(100, Math.round((collected / charged) * 100)) : 0;
                return (
                  <div key={p.id} className="rounded-2xl border bg-gradient-to-br from-violet-50 to-pink-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{p.name}</div>
                      <Badge color="violet">{p.type}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.periodMonth ? `${p.periodMonth}/${p.periodYear}` : p.periodYear} · Son: {formatDate(p.dueDate)}
                    </div>
                    <div className="mt-3 text-2xl font-bold">{tl(p.amount)}</div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tahsilat</span>
                        <span className="font-medium">{tl(collected)} / {tl(charged)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full bg-gradient-emerald transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Açık & Gecikmiş Tahakkuklar</CardTitle></CardHeader>
        <CardContent>
          {(outstanding.data ?? []).length === 0 ? <Empty title="Hepsi ödenmiş 🎉" subtitle="Bekleyen tahakkuk yok." /> : (
            <Table>
              <THead>
                <tr>
                  <th>Plan</th><th>Daire</th><th>Sakin</th>
                  <th className="text-right">Tutar</th><th className="text-right">Ödenen</th>
                  <th className="text-right">Kalan</th><th>Durum</th><th></th>
                </tr>
              </THead>
              <TBody>
                {(outstanding.data ?? []).map((c: any) => (
                  <tr key={c.id}>
                    <td>{c.planName}</td><td>{c.apartmentLabel}</td><td>{c.residentName ?? "—"}</td>
                    <td className="text-right">{tl(c.amount)}</td>
                    <td className="text-right">{tl(c.paidAmount)}</td>
                    <td className="text-right font-semibold text-rose-600">{tl(c.remaining)}</td>
                    <td><Badge color={statusColors[c.status]}>{c.status}</Badge></td>
                    <td>
                      {isAdmin && (
                        <Dialog open={openPayment === c.id} onOpenChange={(o) => setOpenPayment(o ? c.id : null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="success" onClick={() => paymentForm.setValue("amount", c.remaining)}>
                              Tahsil Et
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Ödeme Kaydet — {c.apartmentLabel}</DialogTitle></DialogHeader>
                            <form
                              onSubmit={paymentForm.handleSubmit((d) =>
                                pay.mutate({ chargeId: c.id, data: { ...d, amount: Number(d.amount) } })
                              )}
                              className="grid gap-3"
                            >
                              <div><Label>Tutar (₺)</Label><Input type="number" step="0.01" {...paymentForm.register("amount", { valueAsNumber: true })} /></div>
                              <div><Label>Tarih</Label><Input type="date" {...paymentForm.register("paymentDate")} /></div>
                              <div>
                                <Label>Yöntem</Label>
                                <select {...paymentForm.register("paymentMethod")} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                                  <option value="HAVALE">Havale/EFT</option>
                                  <option value="NAKIT">Nakit</option>
                                  <option value="KART">Kart</option>
                                </select>
                              </div>
                              <div><Label>Referans</Label><Input {...paymentForm.register("reference")} placeholder="Dekont no" /></div>
                              <div><Label>Notlar</Label><Textarea {...paymentForm.register("notes")} /></div>
                              <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setOpenPayment(null)}>Vazgeç</Button>
                                <Button type="submit" variant="success" disabled={pay.isPending}>Kaydet</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </td>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
