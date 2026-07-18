import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Topic, CategoryId } from "@/lib/topics";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

interface FavoritesState {
  /** Stable ids of favourited topics */
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

interface SettingsState {
  defaultDurationSec: number;
  soundEnabled: boolean;
  setDefaultDurationSec: (sec: number) => void;
  toggleSound: () => void;
}

// Favourites + lightweight settings are kept client-side (localStorage) so
// they're instant and don't need a round-trip. Custom topics + history live
// in the database via the API.
export const useAppStore = create<FavoritesState & SettingsState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      isFavorite: (id) => get().favorites.includes(id),

      defaultDurationSec: 180,
      soundEnabled: true,
      setDefaultDurationSec: (sec) => set({ defaultDurationSec: sec }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    { name: "discuss-timer-app" },
  ),
);

interface EphemeralState {
  customCategories: any[];
  setCustomCategories: (fn: (prev: any[]) => any[]) => void;
}

export const useEphemeralStore = create<EphemeralState>((set) => ({
  customCategories: [],
  setCustomCategories: (fn) => set((s) => ({ customCategories: fn(s.customCategories) })),
}));

// ---------- Helpers shared by the UI ----------

export interface CategoryFilter {
  id: CategoryId | "all";
  label: string;
}

export function topicEquals(a: Topic | null, b: Topic | null) {
  if (!a || !b) return false;
  return a.id === b.id && a.text === b.text;
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (sec === 0) return `${m}m`;
  return `${m}m ${sec}s`;
}
