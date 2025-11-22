"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFoundPage() {
  const router = useRouter();
  const [count, setCount] = useState(10); // seconds before redirect

  useEffect(() => {
    // countdown
    const iv = setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (count <= 0) {
      router.replace("/"); // final redirect to root
    }
  }, [count, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Page not found</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          The page you are looking for doesn’t exist or may have been moved.
        </p>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/6 border border-amber-200 dark:border-amber-800">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Redirecting to Home in</span>
            <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">{count}</span>
            <span className="text-sm text-slate-500 dark:text-slate-300">s</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800">
            Go Home Now
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          If you believe this is an error, please contact support or try refreshing the page.
        </p>
      </div>
    </main>
  );
}
