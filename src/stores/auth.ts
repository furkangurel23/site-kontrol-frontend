"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "SUPER_ADMIN" | "YONETICI" | "YARDIMCI" | "DENETCI" | "SAKIN";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  enabled: boolean;
};

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (t: string, u: AuthUser) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "sk-auth",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);

export const isAdminRole = (r?: Role) =>
  r === "SUPER_ADMIN" || r === "YONETICI" || r === "YARDIMCI";

export const isManager = (r?: Role) => r === "SUPER_ADMIN" || r === "YONETICI";
