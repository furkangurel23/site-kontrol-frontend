"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export default function HomePage() {
  const router = useRouter();
  const { token, hydrated } = useAuthStore();
  useEffect(() => {
    if (!hydrated) return;
    router.replace(token ? "/dashboard" : "/login");
  }, [token, hydrated, router]);
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="animate-pulse text-muted-foreground">Yükleniyor…</div>
    </div>
  );
}
