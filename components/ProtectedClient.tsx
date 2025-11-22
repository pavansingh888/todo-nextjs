"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import { useAuthStore, type User } from "../stores/authStore";
import useInactivity from "../lib/useInactivity";

/**
 * ProtectedClient (improved)
 *
 * Behavior:
 * - Activates inactivity tracking for protected pages.
 * - If authStore already has a user -> skip /auth/me and render children immediately.
 * - Otherwise call /auth/me to validate HttpOnly-cookie session.
 * - While auth is being checked, show a themed skeleton.
 * - Only render children when authChecked === true && user exists.
 * - If authChecked === true && no user -> redirect to /login (no flicker of children).
 */

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Tracks whether we've completed the auth check (success or failure)
  const [authChecked, setAuthChecked] = useState<boolean>(() => Boolean(user));

  // Enable inactivity tracking for protected pages
  useInactivity();

  useEffect(() => {
    // If user already present, mark checked and return early
    if (user) {
      setAuthChecked(true);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const res = await api.get<User>("/auth/me", { withCredentials: true });
        if (!mounted) return;
        setUser(res.data);
        setAuthChecked(true);
      } catch (err) {
        if (!mounted) return;
        // mark that we've finished checking auth (so we won't show children)
        setAuthChecked(true);
        // Redirect unauthenticated users to login. Use replace to avoid polluting history.
        router.replace("/login");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, setUser, user]);

  // While auth is being checked, show the skeleton (no protected children yet)
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
        <div role="status" aria-live="polite" className="w-full max-w-2xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-gradient-to-r from-slate-800 to-slate-600 p-2">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="4" fill="white" opacity="0.06" />
                      <path d="M6 12h12M6 16h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="h-4 w-40 rounded-md bg-slate-100 dark:bg-slate-700 animate-pulse" />
                    <div className="mt-1 h-3 w-24 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-700 animate-pulse" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <div className="h-5 w-3/4 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  <div className="mt-3 space-y-3">
                    <div className="h-3 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
                    <div className="h-3 rounded bg-slate-100 dark:bg-slate-700 animate-pulse w-5/6" />
                    <div className="h-3 rounded bg-slate-100 dark:bg-slate-700 animate-pulse w-2/3" />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-3">
                  <div
                    aria-hidden
                    className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-r-transparent dark:border-slate-200 dark:border-r-transparent"
                  />
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Checking session…</div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400">
              If you are already signed in, this will open shortly. Otherwise you'll be redirected to login.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // authChecked is true. Only render children when we actually have a user.
  if (!user) {
    // user absent after check — we already redirected; render null (avoid flash)
    return null;
  }

  // authenticated — render protected content
  return <>{children}</>;
}
