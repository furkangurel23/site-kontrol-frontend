"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Wrench } from "lucide-react";

import { api } from "@/lib/api";
import { extractApiError, formatDateTime } from "@/lib/utils";
import { COMPLAINT_STATUS_COLORS, PRIORITY_COLORS } from "@/lib/status-colors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isAdminRole, useAuthStore } from "@/stores/auth";

type Complaint = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  openedByName?: string | null;
  openedAt?: string | null;
  assignedToName?: string | null;
  resolutionNotes?: string | null;
};

type ComplaintFormValues = {
  title: string;
  description: string;
  category: string;
  priority: string;
};

export default function TaleplerPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore.getState().user?.role);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const list = useQuery<Complaint[]>({
    queryKey: ["complaints", statusFilter],
    queryFn: async () => (await api.get("/api/complaints", {
      params: { size: 100, status: statusFilter || undefined },
    })).data.content,
  });

  const form = useForm<ComplaintFormValues>({
    defaultValues: { title: "", description: "", category: "DIGER", priority: "NORMAL" },
  });

  const create = useMutation({
    mutationFn: async (data: ComplaintFormValues) => (await api.post("/api/complaints", data)).data,
    onSuccess: () => { toast.success("Talep oluşturuldu, yönetim bilgilendirildi"); qc.invalidateQueries({ queryKey: ["complaints"] }); setOpen(false); form.reset(); },
    onError: (e: unknown) => toast.error(extractApiError(e) ?? "Hata"),
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Complaint> }) => (await api.patch(`/api/complaints/${id}`, data)).data,
    onSuccess: () => { toast.success("Güncellendi"); qc.invalidateQueries({ queryKey: ["complaints"] }); },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Arıza ve Talepler"
        subtitle="Site ile ilgili sorunları takip edin"
        actions={
          <>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
              <option value="">Tüm durumlar</option>
              <option value="ACIK">Açık</option>
              <option value="ISLEMDE">İşlemde</option>
              <option value="BEKLIYOR">Bekliyor</option>
              <option value="KAPALI">Kapalı</option>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Talep</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yeni Arıza / Talep</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                  <Field label="Başlık"><Input {...form.register("title", { required: true })} /></Field>
                  <Field label="Açıklama"><Textarea rows={4} {...form.register("description", { required: true })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Kategori">
                      <Select {...form.register("category")}>
                        <option value="ASANSOR">Asansör</option>
                        <option value="SU">Su Tesisatı</option>
                        <option value="ELEKTRIK">Elektrik</option>
                        <option value="ISITMA">Isıtma</option>
                        <option value="ORTAK_ALAN">Ortak Alan</option>
                        <option value="GUVENLIK">Güvenlik</option>
                        <option value="TEMIZLIK">Temizlik</option>
                        <option value="DIGER">Diğer</option>
                      </Select>
                    </Field>
                    <Field label="Öncelik">
                      <Select {...form.register("priority")}>
                        <option value="DUSUK">Düşük</option>
                        <option value="NORMAL">Normal</option>
                        <option value="YUKSEK">Yüksek</option>
                        <option value="ACIL">Acil</option>
                      </Select>
                    </Field>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
                    <Button type="submit" disabled={create.isPending}>Gönder</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {(list.data ?? []).length === 0 ? (
        <Card><CardContent className="pt-5"><Empty title="Talep yok" /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(list.data ?? []).map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start gap-4 pt-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{c.title}</h3>
                    <Badge color={COMPLAINT_STATUS_COLORS[c.status] ?? "slate"}>{c.status}</Badge>
                    <Badge color={PRIORITY_COLORS[c.priority] ?? "slate"}>{c.priority}</Badge>
                    <Badge color="slate">{c.category}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Açan: <b>{c.openedByName ?? "—"}</b> · {formatDateTime(c.openedAt)}
                    {c.assignedToName && <> · Atanan: <b>{c.assignedToName}</b></>}
                  </div>
                  {c.resolutionNotes && (
                    <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">
                      <b>Çözüm:</b> {c.resolutionNotes}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-2">
                    <Select
                      value={c.status}
                      onChange={(e) => update.mutate({ id: c.id, data: { status: e.target.value } })}
                      className="w-36 text-xs"
                    >
                      <option value="ACIK">Açık</option>
                      <option value="ISLEMDE">İşlemde</option>
                      <option value="BEKLIYOR">Bekliyor</option>
                      <option value="KAPALI">Kapat</option>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
