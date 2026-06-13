"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Home, Megaphone, Wallet, Wrench } from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api";
import { cn, tl } from "@/lib/utils";
import { balanceTextClass } from "@/lib/status-colors";
import { StatCard } from "@/components/charts/stat-card";
import { useChartSize } from "@/components/charts/chart-box";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, THead, Table, Td, Th } from "@/components/ui/table";
import { SiteLocationCard } from "@/components/dashboard/site-location-card";

type ApartmentDuesSummary = {
  apartmentId: number;
  apartmentLabel: string;
  totalCharged: number;
  totalPaid: number;
  outstanding: number;
  openCharges: number;
};

type DashboardSummary = {
  range: { start: string; end: string };
  totals: {
    apartments: number;
    occupied: number;
    users: number;
    outstandingDues: number;
    collectedInRange: number;
    spentInRange: number;
    balanceInRange: number;
    openComplaints: number;
  };
};

type CashflowPoint = {
  month: string;
  income: number;
  expense: number;
  balance: number;
};

type CategoryTotal = {
  categoryId: number;
  name: string;
  color: string | null;
  total: number;
};

type AnnouncementSummary = {
  id: number;
  title: string;
  body: string;
  category: string;
  isPinned: boolean;
};

type ComplaintSummary = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
};

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#84cc16"];

export default function DashboardHome() {
  const year = new Date().getFullYear();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const summary = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary", start, end],
    queryFn: async () =>
      (await api.get("/api/dashboard/summary", { params: { start, end } })).data,
  });

  const cashflow = useQuery<CashflowPoint[]>({
    queryKey: ["dashboard", "cashflow", start, end],
    queryFn: async () =>
      (await api.get("/api/dashboard/cashflow/monthly", { params: { start, end } })).data,
  });

  const expenseByCategory = useQuery<CategoryTotal[]>({
    queryKey: ["expenses", "by-category", start, end],
    queryFn: async () =>
      (await api.get("/api/expenses/summary/by-category", { params: { start, end } })).data,
  });

  const outstandingList = useQuery<ApartmentDuesSummary[]>({
    queryKey: ["dues", "summary"],
    queryFn: async () => (await api.get("/api/dues/summary/by-apartment")).data,
  });

  const announcements = useQuery<AnnouncementSummary[]>({
    queryKey: ["announcements", "feed"],
    queryFn: async () =>
      (await api.get("/api/announcements/feed", { params: { page: 0, size: 4 } })).data.content,
  });

  const complaints = useQuery<ComplaintSummary[]>({
    queryKey: ["complaints", "open"],
    queryFn: async () =>
      (await api.get("/api/complaints", { params: { page: 0, size: 5, status: "ACIK" } })).data
        .content,
  });

  const t = summary.data?.totals;

  const [cashflowRef, cashflowSize] = useChartSize();
  const [pieRef, pieSize] = useChartSize();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Genel Bakış</h1>
          <p className="text-sm text-muted-foreground">{year} yılı özet ve performans</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Daireler"
          value={t?.apartments ?? "—"}
          hint={t ? `${t.occupied} dolu` : ""}
          icon={Home} gradient="brand"
        />
        <StatCard
          title="Tahsilat (Yıl)"
          value={t ? tl(t.collectedInRange) : "—"}
          hint="Bu yıl içinde tahsil edilen"
          icon={Wallet} gradient="emerald"
        />
        <StatCard
          title="Gider (Yıl)"
          value={t ? tl(t.spentInRange) : "—"}
          hint="Bu yıl içinde harcanan"
          icon={Megaphone} gradient="amber"
        />
        <StatCard
          title="Açık Borç"
          value={t ? tl(t.outstandingDues) : "—"}
          hint={t?.openComplaints ? `${t.openComplaints} açık talep` : ""}
          icon={AlertTriangle} gradient="rose"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aylık Nakit Akışı</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div ref={cashflowRef} className="h-full w-full">
              {cashflowSize.width > 0 && cashflowSize.height > 0 && (
                <BarChart width={cashflowSize.width} height={cashflowSize.height} data={cashflow.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip
                    formatter={(value) => tl(value as number)}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Tahsilat" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" name="Gider" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gider Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div ref={pieRef} className="h-56 w-full">
              {pieSize.width > 0 && pieSize.height > 0 && (
                <PieChart width={pieSize.width} height={pieSize.height}>
                  <Pie
                    data={(expenseByCategory.data ?? []).map((d, i) => ({
                      name: d.name,
                      value: Number(d.total),
                      fill: d.color ?? COLORS[i % COLORS.length],
                    }))}
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  />
                  <Tooltip formatter={(value) => tl(value as number)} contentStyle={{ borderRadius: 12 }} />
                </PieChart>
              )}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {(expenseByCategory.data ?? []).slice(0, 8).map((d, i) => (
                <div key={d.categoryId} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: d.color ?? COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>En Borçlu Daireler</CardTitle>
            <Link href="/dashboard/aidat" className="text-xs text-violet-600 hover:underline">Tümü →</Link>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  <Th>Daire</Th>
                  <Th align="right">Tahakkuk</Th>
                  <Th align="right">Tahsilat</Th>
                  <Th align="right">Bakiye</Th>
                </tr>
              </THead>
              <TBody>
                {(outstandingList.data ?? []).slice(0, 6).map((r: ApartmentDuesSummary) => (
                  <tr key={r.apartmentId}>
                    <Td>{r.apartmentLabel}</Td>
                    <Td align="right">{tl(r.totalCharged)}</Td>
                    <Td align="right">{tl(r.totalPaid)}</Td>
                    <Td align="right" className={cn("font-semibold", balanceTextClass(r.outstanding))}>
                      {tl(r.outstanding)}
                    </Td>
                  </tr>
                ))}
                {!(outstandingList.data ?? []).length && (
                  <tr>
                    <Td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Veri yok
                    </Td>
                  </tr>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Açık Talepler</CardTitle>
            <Link href="/dashboard/talepler" className="text-xs text-violet-600 hover:underline">Tümü →</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {(complaints.data ?? []).map((c) => (
              <Link key={c.id} href={`/dashboard/talepler`} className="block">
                <div className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.category} · {c.priority}</div>
                  </div>
                  <span className="text-xs text-rose-600">{c.status}</span>
                </div>
              </Link>
            ))}
            {!(complaints.data ?? []).length && (
              <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
                Açık talep yok 🎉
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SiteLocationCard />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Son Duyurular</CardTitle>
          <Link href="/dashboard/duyurular" className="text-xs text-violet-600 hover:underline">Tümü →</Link>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(announcements.data ?? []).map((a) => (
            <div key={a.id} className="rounded-xl border p-4 transition hover:shadow-md">
              <div className="mb-1 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">{a.category}</span>
                {a.isPinned && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">📌</span>}
              </div>
              <div className="font-semibold">{a.title}</div>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{a.body}</p>
            </div>
          ))}
          {!(announcements.data ?? []).length && (
            <div className="col-span-full rounded-xl border p-6 text-center text-sm text-muted-foreground">
              Duyuru yok
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
