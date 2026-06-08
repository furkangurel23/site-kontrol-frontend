"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileText, Gavel, Plus } from "lucide-react";

import { api } from "@/lib/api";
import { extractApiError, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Empty } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isAdminRole, useAuthStore } from "@/stores/auth";

type Meeting = {
  id: number;
  title: string;
  meetingDate: string;
  location?: string | null;
  type: "OLAGAN" | "OLAGANUSTU" | string;
  agenda?: string | null;
  minutes?: string | null;
};

type MeetingFormValues = {
  title: string;
  meetingDate: string;
  location?: string;
  type: string;
  agenda?: string;
  minutes?: string;
};

export default function ToplantilarPage() {
  const qc = useQueryClient();
  const isAdmin = isAdminRole(useAuthStore.getState().user?.role);
  const [open, setOpen] = useState(false);

  const list = useQuery<Meeting[]>({
    queryKey: ["meetings"],
    queryFn: async () => (await api.get("/api/meetings", { params: { size: 50 } })).data.content,
  });

  const form = useForm<MeetingFormValues>({
    defaultValues: {
      title: "", meetingDate: new Date().toISOString().slice(0, 16), location: "Site Toplantı Salonu",
      type: "OLAGAN", agenda: "", minutes: "",
    },
  });

  const create = useMutation({
    mutationFn: async (data: MeetingFormValues) => (await api.post("/api/meetings", {
      ...data,
      meetingDate: new Date(data.meetingDate).toISOString(),
    })).data,
    onSuccess: () => { toast.success("Toplantı kaydedildi"); qc.invalidateQueries({ queryKey: ["meetings"] }); setOpen(false); form.reset(); },
    onError: (e: unknown) => toast.error(extractApiError(e) ?? "Hata"),
  });

  const downloadDocx = async (id: number) => {
    const res = await api.get(`/api/reports/meetings/${id}.docx`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = `toplanti-${id}.docx`; a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Toplantılar"
        subtitle="Yönetim kurulu kararları ve tutanaklar"
        actions={
          isAdmin ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Yeni Toplantı</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yeni Toplantı</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid gap-3">
                  <Field label="Başlık"><Input {...form.register("title", { required: true })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tarih ve Saat"><Input type="datetime-local" {...form.register("meetingDate", { required: true })} /></Field>
                    <Field label="Tip">
                      <Select {...form.register("type")}>
                        <option value="OLAGAN">Olağan</option>
                        <option value="OLAGANUSTU">Olağanüstü</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Yer"><Input {...form.register("location")} /></Field>
                  <Field label="Gündem"><Textarea rows={3} {...form.register("agenda")} /></Field>
                  <Field label="Tutanak"><Textarea rows={4} {...form.register("minutes")} /></Field>
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

      {(list.data ?? []).length === 0 ? (
        <Card><CardContent className="pt-5"><Empty title="Toplantı yok" /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(list.data ?? []).map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-violet text-white">
                      <Gavel className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle>{m.title}</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(m.meetingDate)} · {m.location ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={m.type === "OLAGAN" ? "violet" : "rose"}>{m.type}</Badge>
                    <Button size="sm" variant="outline" onClick={() => downloadDocx(m.id)}>
                      <FileText className="h-4 w-4" />Word
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {m.agenda && <div><div className="text-xs font-semibold text-muted-foreground">GÜNDEM</div><p className="whitespace-pre-wrap text-sm">{m.agenda}</p></div>}
                {m.minutes && <div><div className="text-xs font-semibold text-muted-foreground">TUTANAK</div><p className="whitespace-pre-wrap text-sm">{m.minutes}</p></div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
