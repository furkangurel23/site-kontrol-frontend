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
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const roleColors: Record<string, "violet" | "emerald" | "amber" | "blue" | "slate"> = {
  SUPER_ADMIN: "violet", YONETICI: "emerald", YARDIMCI: "amber", DENETCI: "blue", SAKIN: "slate",
};

export default function KullanicilarPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const list = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/api/users", { params: { size: 200 } })).data.content,
  });

  const form = useForm<any>({
    defaultValues: { fullName: "", email: "", password: "", role: "SAKIN", phone: "" },
  });

  const create = useMutation({
    mutationFn: async (data: any) => (await api.post("/api/users", data)).data,
    onSuccess: () => { toast.success("Kullanıcı oluşturuldu"); qc.invalidateQueries({ queryKey: ["users"] }); setOpen(false); form.reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Hata"),
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/users/${id}`),
    onSuccess: () => { toast.success("Silindi"); qc.invalidateQueries({ queryKey: ["users"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcılar</h1>
          <p className="text-sm text-muted-foreground">Sisteme giriş yapabilen kişiler ve rolleri</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Kullanıcı</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Kullanıcı</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
              <div><Label>Ad Soyad</Label><Input {...form.register("fullName", { required: true })} /></div>
              <div><Label>E-posta</Label><Input type="email" {...form.register("email", { required: true })} /></div>
              <div><Label>Telefon</Label><Input {...form.register("phone")} /></div>
              <div><Label>Şifre (en az 8 karakter)</Label><Input type="password" minLength={8} {...form.register("password", { required: true })} /></div>
              <div>
                <Label>Rol</Label>
                <select {...form.register("role")} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">
                  <option value="SAKIN">Sakin</option>
                  <option value="YARDIMCI">Yönetici Yardımcısı</option>
                  <option value="YONETICI">Yönetici</option>
                  <option value="DENETCI">Denetçi (Yönetim Kurulu)</option>
                  <option value="SUPER_ADMIN">Süper Admin</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
                <Button type="submit" disabled={create.isPending}>Kaydet</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Tüm Kullanıcılar</CardTitle></CardHeader>
        <CardContent>
          {(list.data ?? []).length === 0 ? <Empty /> : (
            <Table>
              <THead><tr><th>Ad Soyad</th><th>E-posta</th><th>Rol</th><th>Durum</th><th></th></tr></THead>
              <TBody>
                {(list.data ?? []).map((u: any) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.fullName}</td>
                    <td>{u.email}</td>
                    <td><Badge color={roleColors[u.role]}>{u.role}</Badge></td>
                    <td>{u.enabled ? <Badge color="emerald">Aktif</Badge> : <Badge color="rose">Pasif</Badge>}</td>
                    <td><Button size="icon" variant="ghost" onClick={() => del.mutate(u.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button></td>
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
