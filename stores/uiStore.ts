import { create } from "zustand";

type UIState = {
  isModalOpen: boolean;
  countdown: number;
  timeoutMinutes: number;
  staySignedIn: boolean;
  openModal: (seconds?: number) => void;
  closeModal: () => void;
  setCountdown: (n: number) => void;
  setTimeoutMinutes: (m: number) => void;
  setStaySignedIn: (v: boolean) => void;
};

const LS_KEY = "ui_settings_v1";

function loadInitial() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (!raw) return { timeoutMinutes: 2, staySignedIn: false }; // sensible defaults
    const parsed = JSON.parse(raw);
    return {
      timeoutMinutes: typeof parsed.timeoutMinutes === "number" ? parsed.timeoutMinutes : 2,
      staySignedIn: typeof parsed.staySignedIn === "boolean" ? parsed.staySignedIn : false,
    };
  } catch {
    return { timeoutMinutes: 2, staySignedIn: false };
  }
}

const initial = loadInitial();

export const useUIStore = create<UIState>((set, get) => ({
  isModalOpen: false,
  countdown: 60,
  timeoutMinutes: initial.timeoutMinutes,
  staySignedIn: initial.staySignedIn,
  openModal: (seconds = 60) => set({ isModalOpen: true, countdown: seconds }),
  closeModal: () => set({ isModalOpen: false }),
  setCountdown: (n) => set({ countdown: n }),
  setTimeoutMinutes: (m) => {
    set({ timeoutMinutes: m });
    // persist preferences
    try {
      const cur = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
      const prev = cur ? JSON.parse(cur) : {};
      const next = { ...prev, timeoutMinutes: m };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist timeoutMinutes:", e);
    }
  },
  setStaySignedIn: (v) => {
    set({ staySignedIn: v });
    try {
      const cur = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
      const prev = cur ? JSON.parse(cur) : {};
      const next = { ...prev, staySignedIn: v };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist staySignedIn:", e);
    }
  },
}));
