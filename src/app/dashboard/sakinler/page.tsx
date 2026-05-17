"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, FileSpreadsheet, FileText, Search } from "lucide-react";

import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Table, THead, TBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isAdminRole, useAuthStore } from "@/stores/auth";

export default function SakinlerPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore.getState().user?.role);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const apartments = useQuery({
    queryKey: ["apartments", "all"],
    queryFn: async () => (await api.get("/api/apartments/all")).data,
  });

  const list = useQuery({
    queryKey: ["residents", q],
    queryFn: async () => (await api.get("/api/residents", { params: { q: q || undefined, size: 200 } })).data.content,
  });

  const form = useForm<any>({
    defaultValues: { apartmentId: "", fullName: "", phone: "", email: "", type: "MALIK", isPrimary: true },
  });

  const create = useMutation({
    mutationFn: async (data: any) => (await api.post("/api/residents", { ...data, apartmentId: Number(data.apartmentId) })).data,
    onSuccess: () => { toast.success("Sakin eklendi"); qc.invalidateQueries({ queryKey: ["residents"] }); setOpen(false); form.reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Hata"),
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/residents/${id}`),
    onSuccess: () => { toast.success("Silindi"); qc.invalidateQueries({ queryKey: ["residents"] }); },
  });

  const download = async (kind: "xlsx" | "docx") => {
    const res = await api.get(`/api/reports/residents.${kind}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = `sakinler.${kind}`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sakinler</h1>
          <p className="text-sm text-muted-foreground">Tüm malikler ve kiracılar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => download("xlsx")}><FileSpreadsheet className="h-4 w-4" />Excel</Button>
          <Button variant="outline" onClick={() => download("docx")}><FileText className="h-4 w-4" />Word</Button>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Sakin</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yeni Sakin</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                  <div>
                    <Label>Daire</Label>
                    <select {...form.register("apartmentId", { required: true })} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                      <option value="">Seçin</option>
                      {(apartments.data ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.block}/{a.apartmentNumber}</option>)}
                    </select>
                  </div>
                  <div><Label>Ad Soyad</Label><Input {...form.register("fullName", { required: true })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Telefon</Label><Input {...form.register("phone")} /></div>
                    <div><Label>E-posta</Label><Input type="email" {...form.register("email")} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>TC No</Label><Input {...form.register("identityNo")} /></div>
                    <div>
                      <Label>Tip</Label>
                      <select {...form.register("type")} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                        <option value="MALIK">Malik</option>
                        <option value="KIRACI">Kiracı</option>
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
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İsim veya telefon ara…" className="pl-9" />
      </div>

      <Card>
        <CardContent className="pt-5">
          {(list.data ?? []).length === 0 ? <Empty title="Sakin yok" /> : (
            <Table>
              <THead><tr><th>Daire</th><th>Ad Soyad</th><th>Tip</th><th>Telefon</th><th>E-posta</th><th></th></tr></THead>
              <TBody>
                {(list.data ?? []).map((r: any) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.apartmentLabel ?? "—"}</td>
                    <td>{r.fullName}</td>
                    <td><Badge color={r.type === "MALIK" ? "violet" : "amber"}>{r.type}</Badge></td>
                    <td>{r.phone ?? "—"}</td>
                    <td>{r.email ?? "—"}</td>
                    <td>{isAdmin && <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button>}</td>
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
