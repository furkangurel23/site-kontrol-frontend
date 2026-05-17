"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Wrench } from "lucide-react";

import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isAdminRole, useAuthStore } from "@/stores/auth";

const statusColors: Record<string, "rose" | "amber" | "blue" | "emerald"> = {
  ACIK: "rose", ISLEMDE: "amber", BEKLIYOR: "blue", KAPALI: "emerald",
};
const priorityColors: Record<string, "slate" | "amber" | "rose"> = {
  DUSUK: "slate", NORMAL: "slate", YUKSEK: "amber", ACIL: "rose",
};

export default function TaleplerPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore.getState().user?.role);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const list = useQuery({
    queryKey: ["complaints", statusFilter],
    queryFn: async () => (await api.get("/api/complaints", {
      params: { size: 100, status: statusFilter || undefined },
    })).data.content,
  });

  const form = useForm<any>({
    defaultValues: { title: "", description: "", category: "DIGER", priority: "NORMAL" },
  });

  const create = useMutation({
    mutationFn: async (data: any) => (await api.post("/api/complaints", data)).data,
    onSuccess: () => { toast.success("Talep oluşturuldu, yönetim bilgilendirildi"); qc.invalidateQueries({ queryKey: ["complaints"] }); setOpen(false); form.reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Hata"),
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => (await api.patch(`/api/complaints/${id}`, data)).data,
    onSuccess: () => { toast.success("Güncellendi"); qc.invalidateQueries({ queryKey: ["complaints"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Arıza ve Talepler</h1>
          <p className="text-sm text-muted-foreground">Site ile ilgili sorunları takip edin</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm">
            <option value="">Tüm durumlar</option>
            <option value="ACIK">Açık</option>
            <option value="ISLEMDE">İşlemde</option>
            <option value="BEKLIYOR">Bekliyor</option>
            <option value="KAPALI">Kapalı</option>
          </select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Talep</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Yeni Arıza / Talep</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                <div><Label>Başlık</Label><Input {...form.register("title", { required: true })} /></div>
                <div><Label>Açıklama</Label><Textarea rows={4} {...form.register("description", { required: true })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Kategori</Label>
                    <select {...form.register("category")} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                      <option value="ASANSOR">Asansör</option>
                      <option value="SU">Su Tesisatı</option>
                      <option value="ELEKTRIK">Elektrik</option>
                      <option value="ISITMA">Isıtma</option>
                      <option value="ORTAK_ALAN">Ortak Alan</option>
                      <option value="GUVENLIK">Güvenlik</option>
                      <option value="TEMIZLIK">Temizlik</option>
                      <option value="DIGER">Diğer</option>
                    </select>
                  </div>
                  <div>
                    <Label>Öncelik</Label>
                    <select {...form.register("priority")} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                      <option value="DUSUK">Düşük</option>
                      <option value="NORMAL">Normal</option>
                      <option value="YUKSEK">Yüksek</option>
                      <option value="ACIL">Acil</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
                  <Button type="submit" disabled={create.isPending}>Gönder</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(list.data ?? []).length === 0 ? (
        <Card><CardContent className="pt-5"><Empty title="Talep yok" /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(list.data ?? []).map((c: any) => (
            <Card key={c.id}>
              <CardContent className="flex items-start gap-4 pt-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{c.title}</h3>
                    <Badge color={statusColors[c.status]}>{c.status}</Badge>
                    <Badge color={priorityColors[c.priority]}>{c.priority}</Badge>
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
                    <select
                      value={c.status}
                      onChange={(e) => update.mutate({ id: c.id, data: { status: e.target.value } })}
                      className="h-9 rounded-xl border bg-background px-2 text-xs"
                    >
                      <option value="ACIK">Açık</option>
                      <option value="ISLEMDE">İşlemde</option>
                      <option value="BEKLIYOR">Bekliyor</option>
                      <option value="KAPALI">Kapat</option>
                    </select>
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
