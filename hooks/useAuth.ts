import { useMutation } from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuthStore, type User } from "../stores/authStore";

/**
 * useLogin - call dummyjson /auth/login
 * payload: { username, password, expiresInMins? }
 */
export function useLogin() {
    const setUser = useAuthStore((s) => s.setUser);

    return useMutation({
        mutationFn: async (payload: { username: string; password: string; expiresInMins?: number }) => {
            const res = await api.post("/auth/login", payload, { withCredentials: true });
            return res.data as User;
        },
        onSuccess: (data) => {
            try {
                // set user in memory (UI state). No token exposure.
                setUser(data);
                // also notify inactivity system to reset timers
                window.dispatchEvent(new CustomEvent("resetIdle"));
            } catch (e) {
                console.error("Failed to store auth data:", e);
            }
        },
    });
}

/**
 * Call this to log the user out:
 * - Calls the server logout proxy which clears cookies (Set-Cookie: Max-Age=0)
 * - Clears client in-memory user state
 * - Dispatches 'forceLogout' event for other parts of the app (inactivity/modal etc)
 */
export async function logoutLocal(): Promise<void> {
  try {
    // Call server logout route which clears cookies
    // We use the api instance which targets /api
    await api.post("/auth/logout");

    // Clear in-memory user state
    useAuthStore.getState().clearUser();

  } catch (err) {
    // Even on error, clear client-side state to avoid showing protected UI
    useAuthStore.getState().clearUser();
    window.dispatchEvent(new CustomEvent("forceLogout"));
    console.error("logoutLocal error:", err);
  }
}