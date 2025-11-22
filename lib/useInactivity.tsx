// /lib/useInactivity.ts  (or your hooks folder)
"use client";
import { useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUIStore } from "../stores/uiStore";
import { logoutLocal } from "@/hooks/useAuth";

/**
 * Robust inactivity hook:
 * - reads/writes countdown via Zustand store (so UI always sees exact value)
 * - uses getState() to avoid stale closure values
 * - clears timers reliably
 */

export default function useInactivity() {
  const router = useRouter();
  const pathname = usePathname();

  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const setCountdown = useUIStore((s) => s.setCountdown);
  const timeoutMinutes = useUIStore((s) => s.timeoutMinutes);
  const staySignedIn = useUIStore((s) => s.staySignedIn);
  const isModalOpen = useUIStore((s) => s.isModalOpen);

  // access store state directly when needed to avoid stale closures
  const uiGet = useCallback(() => useUIStore.getState(), []);

  const idleTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);
  const isLoggingOut = useRef(false);

  const modalSeconds = 60;

  const clearTimers = useCallback(() => {
    if (idleTimer.current) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    if (countdownTimer.current) {
      window.clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  const performLogout = useCallback(async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    clearTimers();
    closeModal();

    try {
      await logoutLocal();
    } catch (err) {
      console.error("Logout error:", err);
    }

    if (pathname !== "/login") {
      router.push("/login");
    }
  }, [clearTimers, closeModal, router, pathname]);

  const startCountdownInterval = useCallback(() => {
    // ensure any previous countdown is cleared
    if (countdownTimer.current) {
      window.clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }

    // Start interval which reads latest store value each tick
    countdownTimer.current = window.setInterval(() => {
      const cur = uiGet().countdown;
      const next = cur - 1;
      if (next <= 0) {
        // finalize
        setCountdown(0);
        clearTimers();
        performLogout();
      } else {
        setCountdown(next);
      }
    }, 1000);
  }, [clearTimers, performLogout, setCountdown, uiGet]);

  const openCountdownModal = useCallback(() => {
    // open modal and set initial countdown explicitly from store
    openModal(modalSeconds);
    setCountdown(modalSeconds);
    // ensure interval starts after modal opens
    startCountdownInterval();
  }, [openModal, setCountdown, startCountdownInterval]);

  const startIdleTimer = useCallback(() => {
    // if user wants to stay signed in, do nothing
    if (staySignedIn) return;
    clearTimers();

    // convert minutes to ms (ensure numeric)
    const ms = Math.max(0, Number(timeoutMinutes) || 0) * 60 * 1000;

    // Use setTimeout to open the modal after idle timeout
    idleTimer.current = window.setTimeout(() => {
      openCountdownModal();
    }, ms);
  }, [clearTimers, openCountdownModal, timeoutMinutes, staySignedIn]);

  const resetTimer = useCallback(() => {
    // if staySignedIn, cancel everything
    if (uiGet().staySignedIn) {
      clearTimers();
      closeModal();
      return;
    }
    clearTimers();
    closeModal();
    startIdleTimer();
  }, [clearTimers, closeModal, startIdleTimer, uiGet]);

  useEffect(() => {
    const handleReset = () => resetTimer();
    const handleForceLogout = () => {
      if (!isLoggingOut.current) performLogout();
    };

    const activityHandler = (_e: Event) => {
      // if modal open, ignore activity (modal has its own buttons)
      if (uiGet().isModalOpen) return;
      // ignore if stay signed in
      if (uiGet().staySignedIn) return;
      resetTimer();
    };

    // bind events
    window.addEventListener("resetIdle", handleReset);
    window.addEventListener("forceLogout", handleForceLogout);

    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, activityHandler));

    // initial start
    startIdleTimer();

    return () => {
      window.removeEventListener("resetIdle", handleReset);
      window.removeEventListener("forceLogout", handleForceLogout);
      events.forEach((ev) => window.removeEventListener(ev, activityHandler));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTimer, startIdleTimer, performLogout, clearTimers]);

  // react to changes in staySignedIn or timeoutMinutes:
  useEffect(() => {
    if (staySignedIn) {
      clearTimers();
      closeModal();
    } else {
      // restart with new timeout value
      resetTimer();
    }
  }, [staySignedIn, timeoutMinutes, clearTimers, closeModal, resetTimer]);

  return { resetTimer, performLogout, startIdleTimer };
}
