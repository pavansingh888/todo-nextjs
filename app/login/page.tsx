// /Users/pavan/Desktop/todo-nextjs/app/login/page.tsx
"use client";

import { useState } from "react";
import { useLogin } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUIStore } from "../../stores/uiStore";

/**
 * Clean, dark-friendly login page with improved UX.
 */

function TinySpinner({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="inline-block animate-spin rounded-full border-[3px] border-white border-r-transparent"
    />
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();
  const router = useRouter();

  const staySignedIn = useUIStore((s) => s.staySignedIn);
  const setStaySignedIn = useUIStore((s) => s.setStaySignedIn);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const toastId = toast.loading("Signing in...");

    login.mutate(
      { username, password, expiresInMins: 60 },
      {
        onSuccess: () => {
          toast.success("Signed in", { id: toastId });
          router.push("/dashboard");
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message || "Invalid credentials. Please try again.";
          setError(message);
          toast.error(message, { id: toastId });
        },
      }
    );
  };

  const hasError = !!error;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* LEFT: Brand / Illustration */}
          <aside className="hidden md:flex flex-col justify-center gap-6 bg-gradient-to-b from-slate-800 to-slate-700 text-white rounded-xl p-10 shadow-lg h-full">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-md bg-white/10 p-2">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="4" fill="white" opacity="0.06" />
                    <path d="M6 12h12M6 16h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">TaskFlow247</h2>
              </div>

              <h3 className="text-2xl font-bold">Sign in to your workspace</h3>
              <p className="mt-3 text-sm text-slate-200/90 leading-relaxed max-w-sm">
                Quickly sign in with your dummyjson user to manage tasks. Your session is secured using HttpOnly cookies.
              </p>
            </div>

            <div className="mt-4 text-sm text-white/80">
              <div className="mb-2">Demo credentials</div>
              <div className="bg-white/6 rounded px-3 py-2 text-sm">
                <div><strong>username:</strong> emilys</div>
                <div><strong>password:</strong> emilyspass</div>
              </div>
            </div>
          </aside>

          {/* RIGHT: Login card */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Sign in to continue to your dashboard.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm text-slate-700 dark:text-slate-200">Username</span>
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${
                    hasError
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-300 focus:ring-slate-800"
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                  placeholder="emilys"
                  aria-label="username"
                  required
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-700 dark:text-slate-200">Password</span>
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${
                    hasError
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-300 focus:ring-slate-800"
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                  placeholder="emilyspass"
                  type="password"
                  aria-label="password"
                  required
                  autoComplete="current-password"
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </label>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={staySignedIn}
                    onChange={(e) => setStaySignedIn(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    aria-label="Stay signed in"
                  />
                  <span>Stay signed in</span>
                </label>

                <a href="#" className="text-sm text-slate-600 dark:text-slate-300 hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-3 py-2 rounded-md bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={login.isPending}
                aria-label="Sign in"
              >
                {login.isPending ? (
                  <>
                    <TinySpinner />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
              <span>Don't have an account? </span>
              <a href="#" className="text-slate-900 dark:text-slate-100 font-medium hover:underline">Create one</a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
