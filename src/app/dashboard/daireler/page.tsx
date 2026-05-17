"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Table, THead, TBody } from "@/components/ui/table";
import { Empty } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isAdminRole, useAuthStore } from "@/stores/auth";

export default function DairelerPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore.getState().user?.role);
  const [open, setOpen] = useState(false);

  const list = useQuery({
    queryKey: ["apartments"],
    queryFn: async () => (await api.get("/api/apartments", { params: { size: 200 } })).data.content,
  });

  const form = useForm<any>({
    defaultValues: { block: "A", floor: 1, apartmentNumber: "", grossArea: "", netArea: "", landShare: "", type: "MESKEN", status: "DOLU" },
  });

  const create = useMutation({
    mutationFn: async (data: any) => (await api.post("/api/apartments", {
      ...data,
      floor: Number(data.floor),
      grossArea: data.grossArea ? Number(data.grossArea) : null,
      netArea: data.netArea ? Number(data.netArea) : null,
      landShare: data.landShare ? Number(data.landShare) : null,
    })).data,
    onSuccess: () => {
      toast.success("Daire eklendi");
      qc.invalidateQueries({ queryKey: ["apartments"] });
      setOpen(false); form.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Hata"),
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/apartments/${id}`),
    onSuccess: () => { toast.success("Silindi"); qc.invalidateQueries({ queryKey: ["apartments"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daireler</h1>
          <p className="text-sm text-muted-foreground">Tüm bağımsız bölümler</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Daire</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Yeni Daire</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Blok</Label><Input {...form.register("block", { required: true })} /></div>
                  <div><Label>Kat</Label><Input type="number" {...form.register("floor", { required: true })} /></div>
                  <div><Label>Daire No</Label><Input {...form.register("apartmentNumber", { required: true })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Brüt (m²)</Label><Input type="number" step="0.01" {...form.register("grossArea")} /></div>
                  <div><Label>Net (m²)</Label><Input type="number" step="0.01" {...form.register("netArea")} /></div>
                  <div><Label>Arsa Payı</Label><Input type="number" step="0.0001" {...form.register("landShare")} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tip</Label>
                    <select {...form.register("type")} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                      <option value="MESKEN">Mesken</option>
                      <option value="ISYERI">İşyeri</option>
                    </select>
                  </div>
                  <div>
                    <Label>Durum</Label>
                    <select {...form.register("status")} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                      <option value="DOLU">Dolu</option>
                      <option value="BOS">Boş</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
                  <Button type="submit" disabled={create.isPending}>Kaydet</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Daire Listesi</CardTitle></CardHeader>
        <CardContent>
          {(list.data ?? []).length === 0 ? <Empty title="Daire yok" /> : (
            <Table>
              <THead><tr><th>Blok</th><th>Kat</th><th>No</th><th>Tip</th><th>Brüt</th><th>Arsa Payı</th><th>Durum</th><th></th></tr></THead>
              <TBody>
                {(list.data ?? []).map((a: any) => (
                  <tr key={a.id}>
                    <td className="font-medium">{a.block}</td><td>{a.floor}</td><td>{a.apartmentNumber}</td>
                    <td><Badge color={a.type === "MESKEN" ? "violet" : "blue"}>{a.type}</Badge></td>
                    <td>{a.grossArea ?? "—"}</td><td>{a.landShare ?? "—"}</td>
                    <td><Badge color={a.status === "DOLU" ? "emerald" : "slate"}>{a.status}</Badge></td>
                    <td>{isAdmin && <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button>}</td>
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
