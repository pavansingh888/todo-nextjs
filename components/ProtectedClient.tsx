// /Users/pavan/Desktop/todo-nextjs/components/ProtectedClient.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import { useAuthStore, type User } from "../stores/authStore";

/**
 * ProtectedClient:
 * - Attempts to /auth/me on mount to confirm session (uses HttpOnly accessToken cookie)
 * - If /auth/me returns 200, we populate authStore.user
 * - If 401 or error, redirect to /login
 *
 * Note: This is a client component (uses next/navigation).
 */

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // /auth/me expects Authorization bearer or cookie; our server sets cookie
        const res = await api.get<User>("/auth/me", { withCredentials: true });
        if (!mounted) return;
        setUser(res.data);
        setLoading(false);
      } catch (e: any) {
        // not authenticated -> redirect to login
        if (!mounted) return;
        setLoading(false);
        router.push("/login");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, setUser]);

  if (loading) {
    // keep a small spinner or null while checking
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-600">Checking authentication...</div>
      </div>
    );
  }

  return <>{children}</>;
}
