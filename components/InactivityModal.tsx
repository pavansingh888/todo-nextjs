"use client";
import { useUIStore } from "../stores/uiStore";

export default function InactivityModal() {
  const isOpen = useUIStore((s) => s.isModalOpen);
  const countdown = useUIStore((s) => s.countdown);

  if (!isOpen) return null;

  const stay = () => {
    // explicit user intent — dispatch resetIdle so hook resets timer & closes modal
    window.dispatchEvent(new CustomEvent("resetIdle"));
  };

  const forceLogout = () => {
    window.dispatchEvent(new CustomEvent("forceLogout"));
  };

  // clicking the overlay (gray surface) should reset and close modal.
  // clicking inside the modal panel should NOT propagate to overlay.
  const handleOverlayClick = () => {
    window.dispatchEvent(new CustomEvent("resetIdle"));
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Inactivity timeout warning"
    >
      {/* overlay: only this surface triggers reset on click */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleOverlayClick}
        aria-hidden
      />

      {/* modal panel: stop propagation so overlay won't receive clicks from inside */}
      <div
        className="relative bg-white rounded-lg p-6 shadow-lg w-full max-w-md z-10 dark:bg-slate-800 dark:text-slate-100"
        onClick={stopPropagation}
      >
        <h3 className="text-lg font-semibold">You are about to be logged out</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          No activity detected. Logging out in <strong>{countdown}</strong> second{countdown !== 1 ? "s" : ""}.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={stay}
            className="px-4 py-2 rounded bg-slate-700 text-white hover:opacity-95"
            title="Stay logged in"
            aria-label="Stay logged in"
          >
            Stay Login
          </button>

          <button
            onClick={forceLogout}
            className="px-4 py-2 rounded border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600"
            title="Logout now"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
