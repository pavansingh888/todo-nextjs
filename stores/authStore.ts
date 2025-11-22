import {create} from "zustand";

export type User = {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  // add other fields returned by dummyjson if needed
};

type AuthState = {
  user: User | null;
  setUser: (u: User | null) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  clearUser: () => set({ user: null }),
}));
