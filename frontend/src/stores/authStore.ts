import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("team_id");
    // Clear TanStack Query cache — imported lazily to avoid circular deps
    import("@/main").then(({ queryClient }) => queryClient.clear());
    set({ user: null, isAuthenticated: false });
  },
}));
