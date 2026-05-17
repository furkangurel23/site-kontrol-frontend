"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function RaporlarPage() {
  const year = new Date().getFullYear();
  const [start, setStart] = useState(`${year}-01-01`);
  const [end, setEnd] = useState(`${year}-12-31`);

  const download = async (url: string, name: string, params?: any) => {
    const res = await api.get(url, { responseType: "blob", params });
    const blob = URL.createObjectURL(res.data);
    const a = document.createElement("a"); a.href = blob; a.download = name; a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Raporlar</h1>
        <p className="text-sm text-muted-foreground">Excel ve Word formatında veri ihracı</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dönem Aralığı</CardTitle>
          <CardDescription>Bazı raporlar tarih aralığı gerektirir.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div><Label>Başlangıç</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><Label>Bitiş</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-emerald text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Aidat Raporu</CardTitle>
            <CardDescription>Daire bazında toplam tahakkuk, tahsilat ve bakiye.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="success" onClick={() => download("/api/reports/dues.xlsx", "aidat-raporu.xlsx")}>
              Excel İndir
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-amber text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Gider Raporu</CardTitle>
            <CardDescription>Seçilen tarih aralığı için tüm giderler.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="default" onClick={() => download("/api/reports/expenses.xlsx", `gider-${start}-${end}.xlsx`, { start, end })}>
              Excel İndir
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Sakin Listesi (Excel)</CardTitle>
            <CardDescription>Tüm sakinler, daire bazında.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => download("/api/reports/residents.xlsx", "sakinler.xlsx")}>Excel İndir</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-violet text-white">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Sakin Listesi (Word)</CardTitle>
            <CardDescription>Yazdırılabilir Word formatında.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => download("/api/reports/residents.docx", "sakinler.docx")}>Word İndir</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
