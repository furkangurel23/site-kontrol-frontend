"use client";

import { Bell, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  createdAt: string;
}

export function Header() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const unread = useQuery({
    queryKey: ["unread"],
    queryFn: async () => (await api.get("/api/notifications/unread-count")).data.count as number,
    refetchInterval: 30_000,
  });

  const list = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: async () =>
      (await api.get("/api/notifications", { params: { page: 0, size: 8 } })).data
        .content as NotificationItem[],
  });

  // Realtime bildirimler şimdilik polling ile alınıyor (yukarıdaki refetchInterval).
  // EventSource header desteklemediği için SSE entegrasyonu sonraya bırakıldı.

  const readAll = useMutation({
    mutationFn: async () => api.post("/api/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="font-semibold">Site Kontrol</span>
      </div>
      <div className="relative ml-auto flex flex-1 items-center md:max-w-md">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Ara…"
          className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-accent">
          <Bell className="h-5 w-5" />
          {(unread.data ?? 0) > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unread.data}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Bildirimler
            <button className="text-xs text-violet-600 hover:underline" onClick={() => readAll.mutate()}>
              Tümünü okundu işaretle
            </button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-80 overflow-auto scrollbar-thin">
            {(list.data ?? []).length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Yeni bildirim yok.</div>
            ) : (
              (list.data ?? []).map((n) => (
                <Link href={n.link ?? "#"} key={n.id}>
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <div className="flex w-full items-center gap-2">
                      <Badge color={tickColor(n.type)}>{n.type}</Badge>
                      <span className="ml-auto text-[10px] text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                    </div>
                    <div className="text-sm font-medium">{n.title}</div>
                    {n.body && <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                  </DropdownMenuItem>
                </Link>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="hidden h-9 items-center gap-2 rounded-xl bg-violet-50 px-3 text-sm text-violet-700 md:flex">
        <span className="font-medium">{user?.fullName}</span>
        <span className="text-xs opacity-70">· {user?.role}</span>
      </div>
    </header>
  );
}

function tickColor(t: string): "emerald" | "amber" | "rose" | "violet" | "blue" {
  switch (t) {
    case "AIDAT": return "emerald";
    case "BORC": return "rose";
    case "DUYURU": return "violet";
    case "ARIZA": return "amber";
    case "TOPLANTI": return "blue";
    default: return "violet";
  }
}
