"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, LayoutDashboard, Wallet, Receipt, Megaphone, Wrench,
  Users, FileBarChart2, Home, Gavel, UserCog, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdminRole, useAuthStore } from "@/stores/auth";

const items = [
  { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard, color: "text-violet-600" },
  { href: "/dashboard/aidat", label: "Aidat", icon: Wallet, color: "text-emerald-600" },
  { href: "/dashboard/giderler", label: "Giderler", icon: Receipt, color: "text-amber-600" },
  { href: "/dashboard/daireler", label: "Daireler", icon: Home, color: "text-blue-600" },
  { href: "/dashboard/sakinler", label: "Sakinler", icon: Users, color: "text-pink-600" },
  { href: "/dashboard/duyurular", label: "Duyurular", icon: Megaphone, color: "text-rose-600" },
  { href: "/dashboard/talepler", label: "Talepler", icon: Wrench, color: "text-orange-600" },
  { href: "/dashboard/toplantilar", label: "Toplantılar", icon: Gavel, color: "text-indigo-600" },
  { href: "/dashboard/raporlar", label: "Raporlar", icon: FileBarChart2, color: "text-teal-600" },
  { href: "/dashboard/kullanicilar", label: "Kullanıcılar", icon: UserCog, color: "text-slate-600", adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card/80 backdrop-blur md:flex">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white shadow-md">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">Site Kontrol</div>
          <div className="text-xs text-muted-foreground">Yönetim Paneli</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {items.map((it) => {
          if (it.adminOnly && !isAdmin) return null;
          const active = pathname === it.href || (it.href !== "/dashboard" && pathname.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", it.color)} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
          <div className="text-sm font-medium leading-tight">{user?.fullName}</div>
          <div className="text-xs opacity-80">{user?.role}</div>
        </div>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" /> Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
