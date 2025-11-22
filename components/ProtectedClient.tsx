"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import { useAuthStore, type User } from "../stores/authStore";
import useInactivity from "../lib/useInactivity";

/**
 * ProtectedClient:
 * - Calls useInactivity() so any page wrapped by this component
 *   will have inactivity tracking available.
 * - If authStore already has a user, skip the /auth/me fetch.
 * - Otherwise calls /auth/me to validate session (server uses HttpOnly cookies).
 * - On success: populate authStore and render children.
 * - On failure: redirect to /login.
 */

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // enable inactivity tracking for all protected pages
  useInactivity();

  useEffect(() => {
    // if we already have a user in the store, skip network call and render immediately
    if (user) {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        // call our proxied /api/auth/me (axios base is /api) which forwards cookies
        const res = await api.get<User>("/auth/me", { withCredentials: true });
        if (!mounted) return;
        setUser(res.data);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setLoading(false);
        // Not authenticated — redirect to login
        router.replace("/login");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, setUser, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-sm text-slate-600 dark:text-slate-300">Checking authentication…</div>
      </div>
    );
  }

  // render only the protected content; modal is mounted once in RootLayout
  return <>{children}</>;
}
