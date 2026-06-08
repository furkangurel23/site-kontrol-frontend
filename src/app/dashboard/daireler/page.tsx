"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { extractApiError } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, Th, Td } from "@/components/ui/table";
import { Empty } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isAdminRole, useAuthStore } from "@/stores/auth";

type Apartment = {
  id: number;
  block: string;
  floor: number;
  apartmentNumber: string;
  type: "MESKEN" | "ISYERI" | string;
  status: "DOLU" | "BOS" | string;
  grossArea?: number | string | null;
  netArea?: number | string | null;
  landShare?: number | string | null;
};

type ApartmentFormValues = {
  block: string;
  floor: number | string;
  apartmentNumber: string;
  grossArea?: number | string;
  netArea?: number | string;
  landShare?: number | string;
  type: string;
  status: string;
};

export default function DairelerPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore.getState().user?.role);
  const [open, setOpen] = useState(false);

  const list = useQuery<Apartment[]>({
    queryKey: ["apartments"],
    queryFn: async () => (await api.get("/api/apartments", { params: { size: 200 } })).data.content,
  });

  const form = useForm<ApartmentFormValues>({
    defaultValues: { block: "A", floor: 1, apartmentNumber: "", grossArea: "", netArea: "", landShare: "", type: "MESKEN", status: "DOLU" },
  });

  const create = useMutation({
    mutationFn: async (data: ApartmentFormValues) => (await api.post("/api/apartments", {
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
    onError: (e: unknown) => toast.error(extractApiError(e) ?? "Hata"),
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/apartments/${id}`),
    onSuccess: () => { toast.success("Silindi"); qc.invalidateQueries({ queryKey: ["apartments"] }); },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daireler"
        subtitle="Tüm bağımsız bölümler"
        actions={
          isAdmin ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Daire</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yeni Daire</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Blok"><Input {...form.register("block", { required: true })} /></Field>
                    <Field label="Kat"><Input type="number" {...form.register("floor", { required: true })} /></Field>
                    <Field label="Daire No"><Input {...form.register("apartmentNumber", { required: true })} /></Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Brüt (m²)"><Input type="number" step="0.01" {...form.register("grossArea")} /></Field>
                    <Field label="Net (m²)"><Input type="number" step="0.01" {...form.register("netArea")} /></Field>
                    <Field label="Arsa Payı"><Input type="number" step="0.0001" {...form.register("landShare")} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tip">
                      <Select {...form.register("type")}>
                        <option value="MESKEN">Mesken</option>
                        <option value="ISYERI">İşyeri</option>
                      </Select>
                    </Field>
                    <Field label="Durum">
                      <Select {...form.register("status")}>
                        <option value="DOLU">Dolu</option>
                        <option value="BOS">Boş</option>
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
          ) : undefined
        }
      />

      <Card>
        <CardHeader><CardTitle>Daire Listesi</CardTitle></CardHeader>
        <CardContent>
          {(list.data ?? []).length === 0 ? <Empty title="Daire yok" /> : (
            <Table>
              <THead>
                <tr>
                  <Th>Blok</Th>
                  <Th align="right">Kat</Th>
                  <Th>No</Th>
                  <Th>Tip</Th>
                  <Th align="right">Brüt</Th>
                  <Th align="right">Arsa Payı</Th>
                  <Th>Durum</Th>
                  <Th align="right" className="w-[1%]"><span className="sr-only">İşlemler</span></Th>
                </tr>
              </THead>
              <TBody>
                {(list.data ?? []).map((a) => (
                  <tr key={a.id}>
                    <Td className="font-medium">{a.block}</Td>
                    <Td align="right">{a.floor}</Td>
                    <Td>{a.apartmentNumber}</Td>
                    <Td><Badge color={a.type === "MESKEN" ? "violet" : "blue"}>{a.type}</Badge></Td>
                    <Td align="right">{a.grossArea ?? "—"}</Td>
                    <Td align="right">{a.landShare ?? "—"}</Td>
                    <Td><Badge color={a.status === "DOLU" ? "emerald" : "slate"}>{a.status}</Badge></Td>
                    <Td align="right">{isAdmin && <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button>}</Td>
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
