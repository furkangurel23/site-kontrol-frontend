"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Lock, Mail } from "lucide-react";

import { api } from "@/lib/api";
import { extractApiError } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const schema = z.object({
  email: z.email("Geçerli e-posta girin"),
  password: z.string().min(8, "En az 8 karakter"),
});

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@sitekontrol.local", password: "Admin123!" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", data);
      setSession(res.data.accessToken, res.data.user);
      toast.success("Hoş geldin, " + res.data.user.fullName + " 👋");
      router.replace("/dashboard");
    } catch (e: unknown) {
      toast.error(extractApiError(e) ?? "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-brand p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Building2 className="h-7 w-7" />
          Site Kontrol
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Sitenizin tüm işleri, <br /> tek bir panelde.
          </h1>
          <p className="text-white/85">
            Aidat takibi, gider yönetimi, duyurular, talepler ve toplantı tutanakları —
            hepsi bir arada.
          </p>
          <ul className="space-y-2 text-sm text-white/90">
            <li>✅ Aidat planlama & otomatik tahakkuk</li>
            <li>✅ Renkli grafiklerle dashboard</li>
            <li>✅ Excel ve Word olarak rapor indirme</li>
            <li>✅ Anlık bildirim ve e-posta uyarısı</li>
          </ul>
        </div>
        <div className="text-xs text-white/60">© {new Date().getFullYear()} Site Kontrol</div>
        <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-pink-400/20 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 text-lg font-semibold lg:hidden">
            <Building2 className="h-6 w-6 text-violet-600" />
            Site Kontrol
          </div>
          <h2 className="text-2xl font-bold">Tekrar hoş geldin</h2>
          <p className="mt-1 text-sm text-muted-foreground">Hesabınla giriş yap.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" className="pl-9" {...register("email")} />
              </div>
              {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" className="pl-9" {...register("password")} />
              </div>
              {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </Button>

            <div className="rounded-xl bg-violet-50 p-3 text-xs text-violet-700">
              Demo: <b>admin@sitekontrol.local</b> / <b>Admin123!</b>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
