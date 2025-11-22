"use client";
import { useEffect, useRef, useCallback } from "react";
import { useUIStore } from "../stores/uiStore";
import { useRouter, usePathname } from "next/navigation";
import { logoutLocal } from "@/hooks/useAuth";

export default function useInactivity() {
  const timeoutMinutes = useUIStore((s) => s.timeoutMinutes);
  const openModal = useUIStore((s) => s.openModal);
  const setCountdown = useUIStore((s) => s.setCountdown);
  const closeModal = useUIStore((s) => s.closeModal);
  const isModalOpen = useUIStore((s) => s.isModalOpen);

  const router = useRouter();
  const pathname = usePathname();

  const idleTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);
  const isLoggingOut = useRef(false); // Prevent multiple logout calls
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

  const logout = useCallback(async () => {
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
      // navigate after logout
      router.push("/login");
    }
  }, [clearTimers, closeModal, router, pathname]);

  const startIdleTimer = useCallback(() => {
    clearTimers();
    idleTimer.current = window.setTimeout(() => {
      openModal(modalSeconds);
      let secondsLeft = modalSeconds;
      setCountdown(secondsLeft);

      countdownTimer.current = window.setInterval(() => {
        secondsLeft -= 1;
        setCountdown(secondsLeft);
        if (secondsLeft <= 0) {
          clearTimers();
          logout();
        }
      }, 1000);
    }, timeoutMinutes * 60 * 1000);
  }, [clearTimers, openModal, timeoutMinutes, logout, setCountdown]);

  const resetTimer = useCallback(() => {
    // Reset timers and close modal (if any)
    startIdleTimer();
    closeModal();
  }, [startIdleTimer, closeModal]);

  useEffect(() => {
    const handleReset = () => resetTimer();
    const handleForceLogout = () => {
      if (!isLoggingOut.current) {
        logout();
      }
    };

    // When modal is open we intentionally ignore global activity events
    // so clicks inside modal don't close it. Overlay has its own handler.
    const activityHandler = (_e: Event) => {
      if (isModalOpen) {
        return; // ignore all global activity while modal is open
      }
      // When modal is closed, any activity resets timer
      resetTimer();
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

    window.addEventListener("resetIdle", handleReset);
    window.addEventListener("forceLogout", handleForceLogout);

    events.forEach((ev) => window.addEventListener(ev, activityHandler));

    startIdleTimer();

    return () => {
      window.removeEventListener("resetIdle", handleReset);
      window.removeEventListener("forceLogout", handleForceLogout);
      events.forEach((ev) => window.removeEventListener(ev, activityHandler));
      clearTimers();
    };
  }, [resetTimer, startIdleTimer, logout, clearTimers, isModalOpen]);

  return { resetTimer, logout, startIdleTimer };
}
