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
  const staySignedIn = useUIStore((s) => s.staySignedIn);

  const router = useRouter();
  const pathname = usePathname();

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
      router.push("/login");
    }
  }, [clearTimers, closeModal, router, pathname]);

  const startIdleTimer = useCallback(() => {
    // if user opted to stay signed in, don't start timers
    if (staySignedIn) return;
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
  }, [clearTimers, openModal, timeoutMinutes, logout, setCountdown, staySignedIn]);

  const resetTimer = useCallback(() => {
    if (staySignedIn) {
      // if staySignedIn, do not start timers
      clearTimers();
      closeModal();
      return;
    }
    startIdleTimer();
    closeModal();
  }, [startIdleTimer, closeModal, staySignedIn, clearTimers]);

  useEffect(() => {
    const handleReset = () => resetTimer();
    const handleForceLogout = () => {
      if (!isLoggingOut.current) {
        logout();
      }
    };

    const activityHandler = (_e: Event) => {
      if (isModalOpen) return;
      // if user opted to stay signed in, do nothing
      if (staySignedIn) return;
      resetTimer();
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

    window.addEventListener("resetIdle", handleReset);
    window.addEventListener("forceLogout", handleForceLogout);

    events.forEach((ev) => window.addEventListener(ev, activityHandler));

    // start timers (if not staySignedIn)
    startIdleTimer();

    return () => {
      window.removeEventListener("resetIdle", handleReset);
      window.removeEventListener("forceLogout", handleForceLogout);
      events.forEach((ev) => window.removeEventListener(ev, activityHandler));
      clearTimers();
    };
  }, [resetTimer, startIdleTimer, logout, clearTimers, isModalOpen, staySignedIn]);

  // Also watch for changes in staySignedIn or timeoutMinutes:
  useEffect(() => {
    if (staySignedIn) {
      // disable timers immediately
      clearTimers();
      closeModal();
    } else {
      // re-start timers with current timeoutMinutes
      startIdleTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staySignedIn, timeoutMinutes]);

  return { resetTimer, logout, startIdleTimer };
}
