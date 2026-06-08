"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileSpreadsheet, Plus } from "lucide-react";

import { api } from "@/lib/api";
import { extractApiError, formatDate, tl } from "@/lib/utils";
import { CHARGE_STATUS_COLORS } from "@/lib/status-colors";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Empty } from "@/components/ui/empty";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { TBody, THead, Table, Td, Th } from "@/components/ui/table";
import { isAdminRole, useAuthStore } from "@/stores/auth";

type Plan = {
  id: number;
  name: string;
  periodYear: number;
  periodMonth?: number;
  amount: number;
  type: string;
  dueDate: string;
  distribution: string;
  description?: string;
  totalCharged?: number;
  totalPaid?: number;
};

type Charge = {
  id: number;
  planName: string | null;
  apartmentLabel: string | null;
  residentName: string | null;
  amount: number;
  paidAmount: number;
  remaining: number;
  status: keyof typeof CHARGE_STATUS_COLORS | string;
};

export default function AidatPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore((s) => s.user?.role));
  const [openPlan, setOpenPlan] = useState(false);
  const [openPayment, setOpenPayment] = useState<number | null>(null);

  const plans = useQuery({
    queryKey: ["dues", "plans"],
    queryFn: async () =>
      (await api.get("/api/dues/plans", { params: { page: 0, size: 24 } })).data.content as Plan[],
  });

  const outstanding = useQuery({
    queryKey: ["dues", "outstanding"],
    queryFn: async () =>
      (await api.get("/api/dues/charges/outstanding", { params: { page: 0, size: 100 } })).data
        .content as Charge[],
  });

  const planForm = useForm({
    defaultValues: {
      name: "",
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
      amount: 500,
      type: "DUZENLI",
      dueDate: new Date().toISOString().slice(0, 10),
      distribution: "ESIT",
      description: "",
    },
  });

  const createPlan = useMutation({
    mutationFn: async (data: typeof planForm.formState.defaultValues) =>
      (await api.post("/api/dues/plans", data)).data,
    onSuccess: () => {
      toast.success("Aidat planı oluşturuldu ve tahakkuklar üretildi.");
      qc.invalidateQueries({ queryKey: ["dues"] });
      setOpenPlan(false);
      planForm.reset();
    },
    onError: (e: unknown) => toast.error(extractApiError(e) ?? "Hata"),
  });

  const paymentForm = useForm({
    defaultValues: {
      amount: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "HAVALE",
      reference: "",
      notes: "",
    },
  });

  const pay = useMutation({
    mutationFn: async ({ chargeId, data }: { chargeId: number; data: typeof paymentForm.formState.defaultValues }) =>
      (await api.post("/api/dues/payments", { ...data, chargeId })).data,
    onSuccess: () => {
      toast.success("Ödeme kaydedildi");
      qc.invalidateQueries({ queryKey: ["dues"] });
      setOpenPayment(null);
      paymentForm.reset();
    },
    onError: (e: unknown) => toast.error(extractApiError(e) ?? "Hata"),
  });

  const downloadExcel = async () => {
    const res = await api.get("/api/reports/dues.xlsx", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aidat-raporu.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aidat"
        subtitle="Plan, tahakkuk ve ödeme takibi"
        actions={
          <>
            <Button variant="outline" onClick={downloadExcel}>
              <FileSpreadsheet className="h-4 w-4" /> Excel İndir
            </Button>
            {isAdmin && (
              <Dialog open={openPlan} onOpenChange={setOpenPlan}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" /> Yeni Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni Aidat Planı</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={planForm.handleSubmit((d) => createPlan.mutate(d))}
                    className="grid gap-3"
                  >
                    <Field label="Plan Adı">
                      <Input
                        {...planForm.register("name", { required: true })}
                        placeholder="2026 Mayıs Aidat"
                      />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Yıl">
                        <Input
                          type="number"
                          {...planForm.register("periodYear", { valueAsNumber: true })}
                        />
                      </Field>
                      <Field label="Ay">
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          {...planForm.register("periodMonth", { valueAsNumber: true })}
                        />
                      </Field>
                      <Field label="Tutar (₺)">
                        <Input
                          type="number"
                          step="0.01"
                          {...planForm.register("amount", { valueAsNumber: true })}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tip">
                        <Select {...planForm.register("type")}>
                          <option value="DUZENLI">Düzenli</option>
                          <option value="EK">Ek Aidat</option>
                          <option value="DEMIRBAS">Demirbaş</option>
                        </Select>
                      </Field>
                      <Field label="Dağılım">
                        <Select {...planForm.register("distribution")}>
                          <option value="ESIT">Eşit</option>
                          <option value="ARSA_PAYI">Arsa Payı</option>
                        </Select>
                      </Field>
                    </div>
                    <Field label="Son Ödeme Tarihi">
                      <Input type="date" {...planForm.register("dueDate")} />
                    </Field>
                    <Field label="Açıklama">
                      <Textarea {...planForm.register("description")} />
                    </Field>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setOpenPlan(false)}>
                        Vazgeç
                      </Button>
                      <Button type="submit" disabled={createPlan.isPending}>
                        {createPlan.isPending ? "Oluşturuluyor…" : "Oluştur"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Planlar</CardTitle>
        </CardHeader>
        <CardContent>
          {(plans.data ?? []).length === 0 ? (
            <Empty title="Plan yok" subtitle="Yeni aidat planı ekleyin." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(plans.data ?? []).map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Açık &amp; Gecikmiş Tahakkuklar</CardTitle>
        </CardHeader>
        <CardContent>
          {(outstanding.data ?? []).length === 0 ? (
            <Empty title="Hepsi ödenmiş 🎉" subtitle="Bekleyen tahakkuk yok." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Plan</Th>
                  <Th>Daire</Th>
                  <Th>Sakin</Th>
                  <Th align="right">Tutar</Th>
                  <Th align="right">Ödenen</Th>
                  <Th align="right">Kalan</Th>
                  <Th>Durum</Th>
                  <Th align="right" className="w-[1%]">
                    <span className="sr-only">İşlemler</span>
                  </Th>
                </tr>
              </THead>
              <TBody>
                {(outstanding.data ?? []).map((charge) => (
                  <tr key={charge.id}>
                    <Td>{charge.planName}</Td>
                    <Td>{charge.apartmentLabel}</Td>
                    <Td>{charge.residentName ?? "—"}</Td>
                    <Td align="right">{tl(charge.amount)}</Td>
                    <Td align="right">{tl(charge.paidAmount)}</Td>
                    <Td align="right" className="font-semibold text-rose-600">
                      {tl(charge.remaining)}
                    </Td>
                    <Td>
                      <Badge color={CHARGE_STATUS_COLORS[charge.status] ?? "slate"}>
                        {charge.status}
                      </Badge>
                    </Td>
                    <Td align="right">
                      {isAdmin && (
                        <Dialog
                          open={openPayment === charge.id}
                          onOpenChange={(o) => setOpenPayment(o ? charge.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => paymentForm.setValue("amount", charge.remaining)}
                            >
                              Tahsil Et
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ödeme Kaydet — {charge.apartmentLabel}</DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={paymentForm.handleSubmit((d) =>
                                pay.mutate({
                                  chargeId: charge.id,
                                  data: { ...d, amount: Number(d.amount) },
                                })
                              )}
                              className="grid gap-3"
                            >
                              <Field label="Tutar (₺)">
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...paymentForm.register("amount", { valueAsNumber: true })}
                                />
                              </Field>
                              <Field label="Tarih">
                                <Input type="date" {...paymentForm.register("paymentDate")} />
                              </Field>
                              <Field label="Yöntem">
                                <Select {...paymentForm.register("paymentMethod")}>
                                  <option value="HAVALE">Havale/EFT</option>
                                  <option value="NAKIT">Nakit</option>
                                  <option value="KART">Kart</option>
                                </Select>
                              </Field>
                              <Field label="Referans">
                                <Input {...paymentForm.register("reference")} placeholder="Dekont no" />
                              </Field>
                              <Field label="Notlar">
                                <Textarea {...paymentForm.register("notes")} />
                              </Field>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setOpenPayment(null)}
                                >
                                  Vazgeç
                                </Button>
                                <Button type="submit" variant="success" disabled={pay.isPending}>
                                  Kaydet
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </Td>
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

function PlanCard({ plan }: { plan: Plan }) {
  const charged = plan.totalCharged ?? 0;
  const collected = plan.totalPaid ?? 0;
  const pct = charged > 0 ? Math.min(100, Math.round((collected / charged) * 100)) : 0;
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-violet-50 to-pink-50 p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{plan.name}</div>
        <Badge color="violet">{plan.type}</Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {plan.periodMonth ? `${plan.periodMonth}/${plan.periodYear}` : plan.periodYear} · Son:{" "}
        {formatDate(plan.dueDate)}
      </div>
      <div className="mt-3 text-2xl font-bold">{tl(plan.amount)}</div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Tahsilat</span>
          <span className="font-medium">
            {tl(collected)} / {tl(charged)}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-gradient-emerald transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

