"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Megaphone, Pin, Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { extractApiError, formatDateTime } from "@/lib/utils";
import { ANNOUNCEMENT_CATEGORY_COLORS } from "@/lib/status-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isAdminRole, useAuthStore } from "@/stores/auth";

type Announcement = {
  id: number;
  title: string;
  body: string;
  category: string;
  targetAudience: string;
  isPinned?: boolean;
  publishedAt?: string | null;
};

type AnnouncementFormValues = {
  title: string;
  body: string;
  category: string;
  targetAudience: string;
  isPinned: boolean;
};

export default function DuyurularPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore.getState().user?.role);
  const [open, setOpen] = useState(false);

  const list = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => (await api.get("/api/announcements", { params: { size: 50 } })).data.content,
  });

  const form = useForm<AnnouncementFormValues>({
    defaultValues: { title: "", body: "", category: "GENEL", targetAudience: "TUMU", isPinned: false },
  });

  const create = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => (await api.post("/api/announcements", data)).data,
    onSuccess: () => { toast.success("Duyuru yayınlandı ve sakinlere bildirim gönderildi"); qc.invalidateQueries({ queryKey: ["announcements"] }); setOpen(false); form.reset(); },
    onError: (e: unknown) => toast.error(extractApiError(e) ?? "Hata"),
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/announcements/${id}`),
    onSuccess: () => { toast.success("Silindi"); qc.invalidateQueries({ queryKey: ["announcements"] }); },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duyurular"
        subtitle="Sakinlere yapılan tüm duyurular"
        actions={
          isAdmin ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Duyuru</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yeni Duyuru</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                  <Field label="Başlık"><Input {...form.register("title", { required: true })} /></Field>
                  <Field label="İçerik"><Textarea rows={5} {...form.register("body", { required: true })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Kategori">
                      <Select {...form.register("category")}>
                        <option value="GENEL">Genel</option>
                        <option value="BAKIM">Bakım</option>
                        <option value="TOPLANTI">Toplantı</option>
                        <option value="ACIL">Acil</option>
                        <option value="MALI">Mali</option>
                      </Select>
                    </Field>
                    <Field label="Hedef Kitle">
                      <Select {...form.register("targetAudience")}>
                        <option value="TUMU">Tümü</option>
                        <option value="MALIK">Malikler</option>
                        <option value="KIRACI">Kiracılar</option>
                      </Select>
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register("isPinned")} /> Üste sabitle
                  </label>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
                    <Button type="submit" disabled={create.isPending}>Yayınla</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {(list.data ?? []).length === 0 ? (
        <Card><CardContent className="pt-5"><Empty title="Duyuru yok" /></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(list.data ?? []).map((a) => (
            <Card key={a.id} className="relative overflow-hidden">
              {a.isPinned && (
                <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-amber-700">
                  <Pin className="h-4 w-4" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-violet-600" />
                  <Badge color={ANNOUNCEMENT_CATEGORY_COLORS[a.category] ?? "violet"}>{a.category}</Badge>
                  <Badge color="slate">{a.targetAudience}</Badge>
                </div>
                <CardTitle className="mt-1">{a.title}</CardTitle>
                <div className="text-xs text-muted-foreground">{formatDateTime(a.publishedAt)}</div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{a.body}</p>
                {isAdmin && (
                  <div className="mt-3 flex justify-end">
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
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
