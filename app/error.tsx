// /app/error.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log client-side error to console (or send to a logging service)
    console.error("Unhandled Error (Global):", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/10 p-6">
      <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-red-100 dark:border-red-900 p-6">
        <h2 className="text-2xl font-semibold text-red-700 dark:text-red-300 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Sorry — the app encountered an unexpected error. You can try to reload the page or return to the home screen.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => {
              // reset() will re-render the nearest error boundary (Next will attempt to recover)
              try {
                reset();
              } catch {
                // fallback: do a hard reload
                router.replace("/");
              }
            }}
            className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
          >
            Try again
          </button>

          <button
            onClick={() => router.replace("/")}
            className="px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700"
          >
            Go to Home
          </button>
        </div>

        <details className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          <summary className="cursor-pointer">Error details (for debugging)</summary>
          <pre className="mt-2 text-xs text-red-600 dark:text-red-300 overflow-auto max-h-40">
            {String(error?.message ?? "No message")}
            {"\n"}
            {String(error?.stack ?? "")}
          </pre>
        </details>
      </div>
    </main>
  );
}
