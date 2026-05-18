import { useMemo, useRef, useState } from "react";
import { useStore } from "zustand";
import { AppShell } from "../../components/layout/AppShell";
import { CategoriesRail } from "../../components/public/CategoriesRail";
import { PinnedPanel } from "../../components/public/PinnedPanel";
import { RecentPanel } from "../../components/public/RecentPanel";
import { SearchBar } from "../../components/public/SearchBar";
import { ThemeToggle } from "../../components/public/ThemeToggle";
import { createPinnedStore } from "../../features/pinned/pinned-store";
import { searchWebsites } from "../../features/search/search-websites";
import type { PublishedSnapshot } from "../../types/snapshot";

type HomePageProps = {
  snapshot: PublishedSnapshot;
};

export function HomePage({ snapshot }: HomePageProps) {
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const pinnedStoreRef = useRef<ReturnType<typeof createPinnedStore> | null>(null);

  if (!pinnedStoreRef.current) {
    pinnedStoreRef.current = createPinnedStore();
  }

  const pinnedIds = useStore(pinnedStoreRef.current, (state) => state.pinnedIds);
  const togglePinned = useStore(pinnedStoreRef.current, (state) => state.togglePinned);

  const sortedCategories = useMemo(
    () => [...snapshot.categories].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)),
    [snapshot.categories],
  );

  const websitesBySearch = useMemo(() => searchWebsites(snapshot.websites, query), [query, snapshot.websites]);

  const categoryCounts = useMemo(() => {
    return websitesBySearch.reduce<Record<string, number>>((counts, website) => {
      counts[website.categoryId] = (counts[website.categoryId] ?? 0) + 1;
      return counts;
    }, {});
  }, [websitesBySearch]);

  const visibleWebsites = useMemo(() => {
    if (!activeCategoryId) return websitesBySearch;
    return websitesBySearch.filter((website) => website.categoryId === activeCategoryId);
  }, [activeCategoryId, websitesBySearch]);

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  const pinnedWebsites = useMemo(() => {
    return snapshot.websites
      .filter((website) => pinnedSet.has(website.id))
      .filter((website) => !activeCategoryId || website.categoryId === activeCategoryId)
      .filter((website) => visibleWebsites.some((candidate) => candidate.id === website.id));
  }, [activeCategoryId, pinnedSet, snapshot.websites, visibleWebsites]);

  const recentWebsites = useMemo(() => {
    return [...visibleWebsites].sort((left, right) => {
      const createdAtDelta = Date.parse(right.createdAt) - Date.parse(left.createdAt);
      return createdAtDelta !== 0 ? createdAtDelta : left.sortOrder - right.sortOrder;
    });
  }, [visibleWebsites]);

  const categoryNamesById = useMemo(() => {
    return Object.fromEntries(sortedCategories.map((category) => [category.id, category.name]));
  }, [sortedCategories]);

  return (
    <AppShell
      topBarTools={
        <>
          <SearchBar value={query} onChange={setQuery} placeholder="Search..." label="Quick search" />
          <ThemeToggle />
        </>
      }
    >
      <section className="hero-panel">
        <div className="hero-panel__content">
          <span className="hero-panel__eyebrow">Published Snapshot v{snapshot.version}</span>
          <h1>Discover curated websites with a calm, fixed-view dashboard.</h1>
          <p>
            Search locally, filter by category, pin your favorites, and scan the most recently published websites without
            leaving the page.
          </p>
        </div>
        <div className="hero-panel__stats" aria-label="Snapshot summary">
          <div>
            <strong>{snapshot.categories.length}</strong>
            <span>categories</span>
          </div>
          <div>
            <strong>{visibleWebsites.length}</strong>
            <span>visible websites</span>
          </div>
          <div>
            <strong>{pinnedWebsites.length}</strong>
            <span>pinned</span>
          </div>
        </div>
      </section>

      <CategoriesRail
        categories={sortedCategories}
        categoryCountById={categoryCounts}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
      />

      <section className="lower-grid">
        <PinnedPanel
          websites={pinnedWebsites}
          categoryNamesById={categoryNamesById}
          pinnedIds={pinnedSet}
          onTogglePinned={togglePinned}
        />
        <RecentPanel
          websites={recentWebsites}
          categoryNamesById={categoryNamesById}
          pinnedIds={pinnedSet}
          onTogglePinned={togglePinned}
        />
      </section>
    </AppShell>
  );
}
