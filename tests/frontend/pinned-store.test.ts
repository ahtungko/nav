import { beforeEach, describe, expect, it } from "vitest";
import { createPinnedStore } from "../../src/features/pinned/pinned-store";
import { STORAGE_KEYS } from "../../src/lib/constants";

beforeEach(() => localStorage.clear());

describe("pinned store", () => {
  it("toggles ids and persists to localStorage", () => {
    const store = createPinnedStore();

    store.getState().togglePinned("site_1");
    expect(store.getState().pinnedIds).toEqual(["site_1"]);
    expect(localStorage.getItem(STORAGE_KEYS.pinned)).toBe('["site_1"]');

    store.getState().togglePinned("site_1");
    expect(store.getState().pinnedIds).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEYS.pinned)).toBe("[]");
  });

  it("hydrates pinned ids from existing localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.pinned, '["site_2","site_3"]');

    const store = createPinnedStore();

    expect(store.getState().pinnedIds).toEqual(["site_2", "site_3"]);
  });

  it("falls back to an empty list when persisted storage is malformed", () => {
    localStorage.setItem(STORAGE_KEYS.pinned, "not-json");

    const store = createPinnedStore();

    expect(store.getState().pinnedIds).toEqual([]);
  });

  it("falls back to an empty list when persisted storage has the wrong shape", () => {
    localStorage.setItem(STORAGE_KEYS.pinned, '"oops"');

    const store = createPinnedStore();

    expect(store.getState().pinnedIds).toEqual([]);
  });
});
