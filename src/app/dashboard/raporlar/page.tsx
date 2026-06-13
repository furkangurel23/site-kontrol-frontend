"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { FileBarChart, FileSpreadsheet, FileText } from "lucide-react";

export default function RaporlarPage() {
  const year = new Date().getFullYear();
  const [start, setStart] = useState(`${year}-01-01`);
  const [end, setEnd] = useState(`${year}-12-31`);

  const [balanceYear, setBalanceYear] = useState(year);
  const [bankBalance, setBankBalance] = useState("");

  const download = async (url: string, name: string, params?: Record<string, string>) => {
    const res = await api.get(url, { responseType: "blob", params });
    const blob = URL.createObjectURL(res.data);
    const a = document.createElement("a"); a.href = blob; a.download = name; a.click();
  };

  const downloadAnnualBalance = () => {
    const params: Record<string, string> = { year: String(balanceYear) };
    if (bankBalance.trim() !== "") params.bankBalance = bankBalance.trim();
    return download(
      "/api/reports/annual-balance.pdf",
      `ozankent-bilanco-${balanceYear}.pdf`,
      params,
    );
  };

  const yearOptions = Array.from({ length: 9 }, (_, i) => year - i);

  return (
    <div className="space-y-6">
      <PageHeader title="Raporlar" subtitle="Excel, Word ve PDF formatında veri ihracı" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-white">
              <FileBarChart className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Yıllık Bilanço (PDF)</CardTitle>
              <CardDescription>
                Devreden, gelir, gider ve kasada kalan; gider dağılımı yüzde barlarıyla. Basılabilir, şık bilanço.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Field label="Yıl">
            <Select
              value={balanceYear}
              onChange={(e) => setBalanceYear(Number(e.target.value))}
              className="w-32"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </Field>
          <Field label="Bankadaki para (opsiyonel)">
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="Örn. 15987,55"
              value={bankBalance}
              onChange={(e) => setBankBalance(e.target.value)}
              className="w-48"
            />
          </Field>
          <Button onClick={downloadAnnualBalance}>PDF İndir</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dönem Aralığı</CardTitle>
          <CardDescription>Bazı raporlar tarih aralığı gerektirir.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Field label="Başlangıç"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Bitiş"><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
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
