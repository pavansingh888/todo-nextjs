"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Simple theme toggle using 'class' strategy.
 * It persists choice in localStorage and toggles 'dark' class on document.documentElement.
 * Compatible with shadcn/ui (which uses Tailwind 'dark:' classes).
 */

const LS_KEY = "site-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = (stored as "light" | "dark") ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    apply(initial);
  }, []);

  function apply(t: "light" | "dark") {
    const el = document.documentElement;
    if (t === "dark") el.classList.add("dark");
    else el.classList.remove("dark");
  }

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    apply(next);
    localStorage.setItem(LS_KEY, next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
      className="p-2 rounded-md border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:opacity-95 transition-colors"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
