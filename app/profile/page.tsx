"use client";

import ProtectedClient from "../../components/ProtectedClient";
import { useState, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { toast } from "sonner";
import { useAuthStore } from "../../stores/authStore";

export default function ProfilePage() {
  // protect the page by wrapping the whole UI in ProtectedClient (below)
  const timeoutMinutes = useUIStore((s) => s.timeoutMinutes);
  const staySignedIn = useUIStore((s) => s.staySignedIn);
  const setTimeoutMinutes = useUIStore((s) => s.setTimeoutMinutes);
  const setStaySignedIn = useUIStore((s) => s.setStaySignedIn);

  const [localTimeout, setLocalTimeout] = useState(timeoutMinutes);
  const [localStay, setLocalStay] = useState(staySignedIn);

  // optional: display logged-in user info
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setLocalTimeout(timeoutMinutes);
  }, [timeoutMinutes]);

  useEffect(() => {
    setLocalStay(staySignedIn);
  }, [staySignedIn]);

  const save = () => {
    const t = Math.max(1, Math.min(240, Math.floor(Number(localTimeout) || 10)));
    setTimeoutMinutes(t);
    setStaySignedIn(Boolean(localStay));
    toast.success("Preferences saved");
  };

  return (
    <ProtectedClient>
      <main className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Profile & Preferences</h1>
              {user && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Signed in as <strong>{user.username}</strong>
                </p>
              )}
            </div>
          </div>

          <section className="mt-6">
            <label className="block text-sm text-slate-700 dark:text-slate-200 mb-2">Inactivity timeout (minutes)</label>
            <input
              type="number"
              min={1}
              max={240}
              value={localTimeout}
              onChange={(e) => setLocalTimeout(Number(e.target.value))}
              className="w-40 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-2">
              When inactive for this many minutes, you will see a 60s warning before auto-logout.
            </p>
          </section>

          <section className="mt-6 flex items-center gap-3">
            <input
              id="staySignedIn"
              type="checkbox"
              checked={localStay}
              onChange={(e) => setLocalStay(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
            />
            <label htmlFor="staySignedIn" className="text-sm text-slate-800 dark:text-slate-200">
              Stay signed in (disable auto-logout)
            </label>
          </section>

          <div className="mt-6 flex gap-2 justify-end">
            <button
              onClick={save}
              className="px-4 py-2 rounded bg-slate-800 text-white hover:bg-slate-700"
            >
              Save preferences
            </button>
          </div>
        </div>
      </main>
    </ProtectedClient>
  );
}
