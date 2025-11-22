"use client";
import { useUIStore } from "../stores/uiStore";

export default function InactivityModal() {
  const isOpen = useUIStore((s) => s.isModalOpen);
  const countdown = useUIStore((s) => s.countdown);

  if (!isOpen) return null;

  const stay = () => {
    window.dispatchEvent(new CustomEvent("resetIdle"));
  };

  const forceLogout = () => {
    window.dispatchEvent(new CustomEvent("forceLogout"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold">You are about to be logged out</h3>
        <p className="mt-2 text-sm text-slate-600">
          No activity detected. Logging out in <strong>{countdown}</strong> second{countdown !== 1 ? "s" : ""}.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={stay} className="px-4 py-2 rounded bg-slate-700 text-white">
            Stay Login
          </button>
          <button onClick={forceLogout} className="px-4 py-2 rounded border border-slate-200">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
