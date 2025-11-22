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
        // Prevent multiple simultaneous logout calls
        if (isLoggingOut.current) return;
        isLoggingOut.current = true;

        clearTimers();
        closeModal();
        
        try {
            await logoutLocal();
        } catch (err) {
            console.error("Logout error:", err);
        }
        
        // Only redirect if not already on login page
        if (pathname !== "/login") {
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
        startIdleTimer();
        closeModal();
    }, [startIdleTimer, closeModal]);

    useEffect(() => {
        const handleReset = () => resetTimer();
        const handleForceLogout = () => {
            // Check if already logging out to prevent loops
            if (!isLoggingOut.current) {
                logout();
            }
        };

        window.addEventListener("resetIdle", handleReset);
        window.addEventListener("forceLogout", handleForceLogout);

        const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
        const activityHandler = () => resetTimer();
        events.forEach((e) => window.addEventListener(e, activityHandler));

        startIdleTimer();

        return () => {
            window.removeEventListener("resetIdle", handleReset);
            window.removeEventListener("forceLogout", handleForceLogout);
            events.forEach((e) => window.removeEventListener(e, activityHandler));
            clearTimers();
        };
    }, [resetTimer, startIdleTimer, logout, clearTimers]);

    return { resetTimer, logout, startIdleTimer };
}