import { STORAGE_KEYS } from "../../lib/constants";
import { readJsonStorage, writeJsonStorage } from "../../lib/local-storage";
import { createStore } from "zustand/vanilla";

function readPinnedIds(): string[] {
  const value = readJsonStorage<unknown>(STORAGE_KEYS.pinned, []);
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

export function createPinnedStore() {
  return createStore<{
    pinnedIds: string[];
    togglePinned: (id: string) => void;
  }>((set, get) => ({
    pinnedIds: readPinnedIds(),
    togglePinned: (id) => {
      const next = get().pinnedIds.includes(id)
        ? get().pinnedIds.filter((value) => value !== id)
        : [...get().pinnedIds, id];
      writeJsonStorage(STORAGE_KEYS.pinned, next);
      set({ pinnedIds: next });
    },
  }));
}
