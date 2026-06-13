"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileSpreadsheet, Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { extractApiError, formatDate, tl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, Th, Td } from "@/components/ui/table";
import { Empty } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useChartSize } from "@/components/charts/chart-box";
import { isAdminRole, useAuthStore } from "@/stores/auth";

type Category = { id: number; name: string; color?: string | null };

type Expense = {
  id: number;
  expenseDate: string;
  categoryName: string;
  categoryColor?: string | null;
  title: string;
  vendor?: string | null;
  amount: number | string;
};

type CategorySummary = { name: string; total: number | string; color?: string | null };

type ExpenseFormValues = {
  categoryId: number | string;
  title: string;
  amount: number | string;
  expenseDate: string;
  vendor?: string;
  invoiceNo?: string;
  description?: string;
};

export default function GiderlerPage() {
  const qc = useQueryClient();
  const user = useAuthStore.getState().user;
  const isAdmin = isAdminRole(user?.role);
  const year = new Date().getFullYear();
  const [start, setStart] = useState(`${year}-01-01`);
  const [end, setEnd] = useState(`${year}-12-31`);
  const [open, setOpen] = useState(false);
  const [catChartRef, catChartSize] = useChartSize();

  const cats = useQuery<Category[]>({
    queryKey: ["expense", "cats"],
    queryFn: async () => (await api.get("/api/expenses/categories")).data,
  });
  const list = useQuery<Expense[]>({
    queryKey: ["expenses", "list"],
    queryFn: async () => (await api.get("/api/expenses", { params: { page: 0, size: 50 } })).data.content,
  });
  const byCategory = useQuery<CategorySummary[]>({
    queryKey: ["expenses", "byCat", start, end],
    queryFn: async () => (await api.get("/api/expenses/summary/by-category", { params: { start, end } })).data,
  });

  const form = useForm<ExpenseFormValues>({
    defaultValues: { categoryId: 0, title: "", amount: 0, expenseDate: new Date().toISOString().slice(0, 10) },
  });

  const create = useMutation({
    mutationFn: async (data: ExpenseFormValues) => (await api.post("/api/expenses", { ...data, amount: Number(data.amount), categoryId: Number(data.categoryId) })).data,
    onSuccess: () => {
      toast.success("Gider kaydedildi");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setOpen(false); form.reset();
    },
    onError: (e: unknown) => toast.error(extractApiError(e) ?? "Hata"),
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
      <PageHeader
        title="Giderler"
        subtitle="Sitenin tüm harcamaları"
        actions={
          <>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" />
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" />
            <Button variant="outline" onClick={downloadExcel}><FileSpreadsheet className="h-4 w-4" />Excel</Button>
            {isAdmin && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Gider</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Yeni Gider</DialogTitle></DialogHeader>
                  <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                    <Field label="Kategori">
                      <Select {...form.register("categoryId", { required: true })}>
                        <option value="">Seçin</option>
                        {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="Başlık"><Input {...form.register("title", { required: true })} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tutar (₺)"><Input type="number" step="0.01" {...form.register("amount", { required: true })} /></Field>
                      <Field label="Tarih"><Input type="date" {...form.register("expenseDate", { required: true })} /></Field>
                    </div>
                    <Field label="Tedarikçi"><Input {...form.register("vendor")} /></Field>
                    <Field label="Fatura No"><Input {...form.register("invoiceNo")} /></Field>
                    <Field label="Açıklama"><Textarea {...form.register("description")} /></Field>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
                      <Button type="submit" disabled={create.isPending}>Kaydet</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      <Card>
        <CardHeader><CardTitle>Kategori Bazlı Dağılım</CardTitle></CardHeader>
        <CardContent className="h-72">
          <div ref={catChartRef} className="h-full w-full">
            {catChartSize.width > 0 && catChartSize.height > 0 && (
              <BarChart width={catChartSize.width} height={catChartSize.height} data={(byCategory.data ?? []).map((d) => ({ name: d.name, total: parseFloat(String(d.total)), fill: d.color ?? "#8b5cf6" }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => tl(v as number)} contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Son Giderler</CardTitle></CardHeader>
        <CardContent>
          {(list.data ?? []).length === 0 ? <Empty title="Gider yok" /> : (
            <Table>
              <THead>
                <tr>
                  <Th>Tarih</Th>
                  <Th>Kategori</Th>
                  <Th>Başlık</Th>
                  <Th>Tedarikçi</Th>
                  <Th align="right">Tutar</Th>
                  <Th align="right" className="w-[1%]"><span className="sr-only">İşlemler</span></Th>
                </tr>
              </THead>
              <TBody>
                {(list.data ?? []).map((e) => (
                  <tr key={e.id}>
                    <Td>{formatDate(e.expenseDate)}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.categoryColor ?? "#8b5cf6" }} />
                        {e.categoryName}
                      </span>
                    </Td>
                    <Td className="font-medium">{e.title}</Td>
                    <Td className="text-muted-foreground">{e.vendor ?? "—"}</Td>
                    <Td align="right" className="font-semibold">{tl(e.amount)}</Td>
                    <Td align="right">
                      {isAdmin && (
                        <Button size="icon" variant="ghost" onClick={() => del.mutate(e.id)}>
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
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
