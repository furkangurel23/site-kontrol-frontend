"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { tl } from "@/lib/utils";
import { StatCard } from "@/components/charts/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Home, Users, Wallet, AlertTriangle, Wrench, Megaphone } from "lucide-react";
import Link from "next/link";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#84cc16"];

export default function DashboardHome() {
  const year = new Date().getFullYear();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const summary = useQuery({
    queryKey: ["dashboard", "summary", start, end],
    queryFn: async () => (await api.get("/api/dashboard/summary", { params: { start, end } })).data,
  });

  const cashflow = useQuery({
    queryKey: ["dashboard", "cashflow", start, end],
    queryFn: async () => (await api.get("/api/dashboard/cashflow/monthly", { params: { start, end } })).data,
  });

  const expenseByCategory = useQuery({
    queryKey: ["expenses", "by-category", start, end],
    queryFn: async () => (await api.get("/api/expenses/summary/by-category", { params: { start, end } })).data,
  });

  const outstandingList = useQuery({
    queryKey: ["dues", "summary"],
    queryFn: async () => (await api.get("/api/dues/summary/by-apartment")).data,
  });

  const announcements = useQuery({
    queryKey: ["announcements", "feed"],
    queryFn: async () => (await api.get("/api/announcements/feed", { params: { page: 0, size: 4 } })).data.content,
  });

  const complaints = useQuery({
    queryKey: ["complaints", "open"],
    queryFn: async () => (await api.get("/api/complaints", { params: { page: 0, size: 5, status: "ACIK" } })).data.content,
  });

  const t = summary.data?.totals;

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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflow.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  formatter={(v: any) => tl(v as number)}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Bar dataKey="income" name="Tahsilat" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" name="Gider" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gider Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(expenseByCategory.data ?? []).map((d: any) => ({ name: d.name, value: parseFloat(d.total) }))}
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(expenseByCategory.data ?? []).map((d: any, i: number) => (
                    <Cell key={i} fill={d.color ?? COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => tl(v as number)} contentStyle={{ borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {(expenseByCategory.data ?? []).slice(0, 8).map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color ?? COLORS[i % COLORS.length] }} />
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
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 text-left">Daire</th>
                  <th className="py-1 text-right">Tahakkuk</th>
                  <th className="py-1 text-right">Tahsilat</th>
                  <th className="py-1 text-right">Bakiye</th>
                </tr>
              </thead>
              <tbody>
                {(outstandingList.data ?? []).slice(0, 6).map((r: any) => (
                  <tr key={r.apartmentId} className="border-t">
                    <td className="py-2">{r.apartmentLabel}</td>
                    <td className="py-2 text-right">{tl(r.totalCharged)}</td>
                    <td className="py-2 text-right">{tl(r.totalPaid)}</td>
                    <td className={`py-2 text-right font-semibold ${parseFloat(r.outstanding) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {tl(r.outstanding)}
                    </td>
                  </tr>
                ))}
                {!(outstandingList.data ?? []).length && (
                  <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Veri yok</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Açık Talepler</CardTitle>
            <Link href="/dashboard/talepler" className="text-xs text-violet-600 hover:underline">Tümü →</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {(complaints.data ?? []).map((c: any) => (
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

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Son Duyurular</CardTitle>
          <Link href="/dashboard/duyurular" className="text-xs text-violet-600 hover:underline">Tümü →</Link>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(announcements.data ?? []).map((a: any) => (
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
