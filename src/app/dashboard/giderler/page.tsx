"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileSpreadsheet, Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { tl, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Table, THead, TBody } from "@/components/ui/table";
import { Empty } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { isAdminRole, useAuthStore } from "@/stores/auth";

export default function GiderlerPage() {
  const qc = useQueryClient();
  const user = useAuthStore.getState().user;
  const isAdmin = isAdminRole(user?.role);
  const year = new Date().getFullYear();
  const [start, setStart] = useState(`${year}-01-01`);
  const [end, setEnd] = useState(`${year}-12-31`);
  const [open, setOpen] = useState(false);

  const cats = useQuery({ queryKey: ["expense", "cats"], queryFn: async () => (await api.get("/api/expenses/categories")).data });
  const list = useQuery({
    queryKey: ["expenses", "list"],
    queryFn: async () => (await api.get("/api/expenses", { params: { page: 0, size: 50 } })).data.content,
  });
  const byCategory = useQuery({
    queryKey: ["expenses", "byCat", start, end],
    queryFn: async () => (await api.get("/api/expenses/summary/by-category", { params: { start, end } })).data,
  });

  const form = useForm<any>({
    defaultValues: { categoryId: 0, title: "", amount: 0, expenseDate: new Date().toISOString().slice(0, 10) },
  });

  const create = useMutation({
    mutationFn: async (data: any) => (await api.post("/api/expenses", { ...data, amount: Number(data.amount), categoryId: Number(data.categoryId) })).data,
    onSuccess: () => {
      toast.success("Gider kaydedildi");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setOpen(false); form.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Hata"),
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/expenses/${id}`),
    onSuccess: () => { toast.success("Silindi"); qc.invalidateQueries({ queryKey: ["expenses"] }); },
  });

  const downloadExcel = async () => {
    const res = await api.get("/api/reports/expenses.xlsx", { params: { start, end }, responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = `gider-raporu-${start}-${end}.xlsx`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Giderler</h1>
          <p className="text-sm text-muted-foreground">Sitenin tüm harcamaları</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" />
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" />
          <Button variant="outline" onClick={downloadExcel}><FileSpreadsheet className="h-4 w-4" />Excel</Button>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Gider</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yeni Gider</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                  <div>
                    <Label>Kategori</Label>
                    <select {...form.register("categoryId", { required: true })} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                      <option value="">Seçin</option>
                      {(cats.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><Label>Başlık</Label><Input {...form.register("title", { required: true })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Tutar (₺)</Label><Input type="number" step="0.01" {...form.register("amount", { required: true })} /></div>
                    <div><Label>Tarih</Label><Input type="date" {...form.register("expenseDate", { required: true })} /></div>
                  </div>
                  <div><Label>Tedarikçi</Label><Input {...form.register("vendor")} /></div>
                  <div><Label>Fatura No</Label><Input {...form.register("invoiceNo")} /></div>
                  <div><Label>Açıklama</Label><Textarea {...form.register("description")} /></div>
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

      <Card>
        <CardHeader><CardTitle>Kategori Bazlı Dağılım</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(byCategory.data ?? []).map((d: any) => ({ name: d.name, total: parseFloat(d.total), color: d.color }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={60} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(v: any) => tl(v as number)} contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {(byCategory.data ?? []).map((d: any, i: number) => <Cell key={i} fill={d.color ?? "#8b5cf6"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Son Giderler</CardTitle></CardHeader>
        <CardContent>
          {(list.data ?? []).length === 0 ? <Empty title="Gider yok" /> : (
            <Table>
              <THead><tr><th>Tarih</th><th>Kategori</th><th>Başlık</th><th>Tedarikçi</th><th className="text-right">Tutar</th><th></th></tr></THead>
              <TBody>
                {(list.data ?? []).map((e: any) => (
                  <tr key={e.id}>
                    <td>{formatDate(e.expenseDate)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.categoryColor ?? "#8b5cf6" }} />
                        {e.categoryName}
                      </span>
                    </td>
                    <td className="font-medium">{e.title}</td>
                    <td className="text-muted-foreground">{e.vendor ?? "—"}</td>
                    <td className="text-right font-semibold">{tl(e.amount)}</td>
                    <td>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" onClick={() => del.mutate(e.id)}>
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
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
