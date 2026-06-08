"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, FileSpreadsheet, FileText, Search } from "lucide-react";

import { api } from "@/lib/api";
import { extractApiError } from "@/lib/utils";
import { RESIDENT_TYPE_COLORS } from "@/lib/status-colors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isAdminRole, useAuthStore } from "@/stores/auth";

type ApartmentOption = { id: number; block: string; apartmentNumber: string };

type Resident = {
  id: number;
  apartmentLabel?: string | null;
  fullName: string;
  type: "MALIK" | "KIRACI" | string;
  phone?: string | null;
  email?: string | null;
};

type ResidentFormValues = {
  apartmentId: number | string;
  fullName: string;
  phone?: string;
  email?: string;
  identityNo?: string;
  type: string;
  isPrimary?: boolean;
};

export default function SakinlerPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore.getState().user?.role);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const apartments = useQuery<ApartmentOption[]>({
    queryKey: ["apartments", "all"],
    queryFn: async () => (await api.get("/api/apartments/all")).data,
  });

  const list = useQuery<Resident[]>({
    queryKey: ["residents", q],
    queryFn: async () => (await api.get("/api/residents", { params: { q: q || undefined, size: 200 } })).data.content,
  });

  const form = useForm<ResidentFormValues>({
    defaultValues: { apartmentId: "", fullName: "", phone: "", email: "", type: "MALIK", isPrimary: true },
  });

  const create = useMutation({
    mutationFn: async (data: ResidentFormValues) => (await api.post("/api/residents", { ...data, apartmentId: Number(data.apartmentId) })).data,
    onSuccess: () => { toast.success("Sakin eklendi"); qc.invalidateQueries({ queryKey: ["residents"] }); setOpen(false); form.reset(); },
    onError: (e: unknown) => toast.error(extractApiError(e) ?? "Hata"),
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
      <PageHeader
        title="Sakinler"
        subtitle="Tüm malikler ve kiracılar"
        actions={
          <>
            <Button variant="outline" onClick={() => download("xlsx")}><FileSpreadsheet className="h-4 w-4" />Excel</Button>
            <Button variant="outline" onClick={() => download("docx")}><FileText className="h-4 w-4" />Word</Button>
            {isAdmin && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Sakin</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Yeni Sakin</DialogTitle></DialogHeader>
                  <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                    <Field label="Daire">
                      <Select {...form.register("apartmentId", { required: true })}>
                        <option value="">Seçin</option>
                        {(apartments.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.block}/{a.apartmentNumber}</option>)}
                      </Select>
                    </Field>
                    <Field label="Ad Soyad"><Input {...form.register("fullName", { required: true })} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Telefon"><Input {...form.register("phone")} /></Field>
                      <Field label="E-posta"><Input type="email" {...form.register("email")} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="TC No"><Input {...form.register("identityNo")} /></Field>
                      <Field label="Tip">
                        <Select {...form.register("type")}>
                          <option value="MALIK">Malik</option>
                          <option value="KIRACI">Kiracı</option>
                        </Select>
                      </Field>
                    </div>
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

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İsim veya telefon ara…" className="pl-9" />
      </div>

      <Card>
        <CardContent className="pt-5">
          {(list.data ?? []).length === 0 ? <Empty title="Sakin yok" /> : (
            <Table>
              <THead>
                <tr>
                  <Th>Daire</Th>
                  <Th>Ad Soyad</Th>
                  <Th>Tip</Th>
                  <Th>Telefon</Th>
                  <Th>E-posta</Th>
                  <Th align="right" className="w-[1%]"><span className="sr-only">İşlemler</span></Th>
                </tr>
              </THead>
              <TBody>
                {(list.data ?? []).map((r) => (
                  <tr key={r.id}>
                    <Td className="font-medium">{r.apartmentLabel ?? "—"}</Td>
                    <Td>{r.fullName}</Td>
                    <Td><Badge color={RESIDENT_TYPE_COLORS[r.type] ?? "slate"}>{r.type}</Badge></Td>
                    <Td>{r.phone ?? "—"}</Td>
                    <Td>{r.email ?? "—"}</Td>
                    <Td align="right">{isAdmin && <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button>}</Td>
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
