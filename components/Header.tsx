"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { logoutLocal } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logoutLocal();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/login");
    }
  };

  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";
  const isDashboard = pathname === "/dashboard";
  const isProfile = pathname === "/profile";

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* LEFT — Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-md bg-gradient-to-r from-slate-800 to-slate-600 p-2">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="white" opacity="0.06" />
              <path d="M6 12h12M6 16h8" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight dark:text-slate-100">TaskFlow247</span>
        </Link>

        {/* RIGHT — NAV BUTTONS */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle Always Visible */}
          <ThemeToggle />

          {!user ? (
            /* ------------------------------------------
             * USER NOT LOGGED IN
             * ----------------------------------------- */
            <>
              {/* Hide Login button if we are already on login page */}
              {!isLogin && (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium bg-slate-900 text-white hover:opacity-95"
                >
                  Login
                </Link>
              )}

              {/* Dashboard is allowed even without login (redirects inside ProtectedClient) */}
              {!isLogin && (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-md text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  Dashboard
                </Link>
              )}
            </>
          ) : (
            /* ------------------------------------------
             * USER LOGGED IN
             * ----------------------------------------- */
            <>
              {/* Show Profile unless we are already on Profile */}
              {!isProfile && (
                <Link
                  href="/profile"
                  className="px-3 py-2 rounded text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  Profile
                </Link>
              )}

              {/* Show Dashboard unless we are already on Dashboard */}
              {!isDashboard && (
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  Dashboard
                </Link>
              )}

              {/* Logout always visible when authenticated */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md text-sm font-medium bg-slate-900 text-white hover:opacity-95"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
