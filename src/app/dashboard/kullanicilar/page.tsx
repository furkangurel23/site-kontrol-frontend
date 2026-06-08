"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { extractApiError } from "@/lib/utils";
import { ROLE_COLORS } from "@/lib/status-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type User = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  enabled: boolean;
};

type UserFormValues = {
  fullName: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
};

export default function KullanicilarPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const list = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/api/users", { params: { size: 200 } })).data.content,
  });

  const form = useForm<UserFormValues>({
    defaultValues: { fullName: "", email: "", password: "", role: "SAKIN", phone: "" },
  });

  const create = useMutation({
    mutationFn: async (data: UserFormValues) => (await api.post("/api/users", data)).data,
    onSuccess: () => { toast.success("Kullanıcı oluşturuldu"); qc.invalidateQueries({ queryKey: ["users"] }); setOpen(false); form.reset(); },
    onError: (e: unknown) => toast.error(extractApiError(e) ?? "Hata"),
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/users/${id}`),
    onSuccess: () => { toast.success("Silindi"); qc.invalidateQueries({ queryKey: ["users"] }); },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcılar"
        subtitle="Sisteme giriş yapabilen kişiler ve rolleri"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Kullanıcı</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Yeni Kullanıcı</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                <Field label="Ad Soyad"><Input {...form.register("fullName", { required: true })} /></Field>
                <Field label="E-posta"><Input type="email" {...form.register("email", { required: true })} /></Field>
                <Field label="Telefon"><Input {...form.register("phone")} /></Field>
                <Field label="Şifre (en az 8 karakter)"><Input type="password" minLength={8} {...form.register("password", { required: true })} /></Field>
                <Field label="Rol">
                  <Select {...form.register("role")}>
                    <option value="SAKIN">Sakin</option>
                    <option value="YARDIMCI">Yönetici Yardımcısı</option>
                    <option value="YONETICI">Yönetici</option>
                    <option value="DENETCI">Denetçi (Yönetim Kurulu)</option>
                    <option value="SUPER_ADMIN">Süper Admin</option>
                  </Select>
                </Field>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
                  <Button type="submit" disabled={create.isPending}>Kaydet</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader><CardTitle>Tüm Kullanıcılar</CardTitle></CardHeader>
        <CardContent>
          {(list.data ?? []).length === 0 ? <Empty /> : (
            <Table>
              <THead>
                <tr>
                  <Th>Ad Soyad</Th>
                  <Th>E-posta</Th>
                  <Th>Rol</Th>
                  <Th>Durum</Th>
                  <Th align="right" className="w-[1%]"><span className="sr-only">İşlemler</span></Th>
                </tr>
              </THead>
              <TBody>
                {(list.data ?? []).map((u) => (
                  <tr key={u.id}>
                    <Td className="font-medium">{u.fullName}</Td>
                    <Td>{u.email}</Td>
                    <Td><Badge color={ROLE_COLORS[u.role] ?? "slate"}>{u.role}</Badge></Td>
                    <Td>{u.enabled ? <Badge color="emerald">Aktif</Badge> : <Badge color="rose">Pasif</Badge>}</Td>
                    <Td align="right"><Button size="icon" variant="ghost" onClick={() => del.mutate(u.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button></Td>
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
