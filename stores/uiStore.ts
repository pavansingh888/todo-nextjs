import {create} from "zustand";

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

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  countdown: 60,
  timeoutMinutes: 1,
  staySignedIn: false,
  openModal: (seconds = 60) => set({ isModalOpen: true, countdown: seconds }),
  closeModal: () => set({ isModalOpen: false }),
  setCountdown: (n) => set({ countdown: n }),
  setTimeoutMinutes: (m) => set({ timeoutMinutes: m }),
  setStaySignedIn: (v) => set({ staySignedIn: v }),
}));
