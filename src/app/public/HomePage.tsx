import { useMemo, useRef, useState } from "react";
import { useStore } from "zustand";
import { AppShell } from "../../components/layout/AppShell";
import { PinCard } from "../../components/public/PinCard";
import { PublicThemeButton } from "../../components/public/PublicThemeButton";
import { SiteCard } from "../../components/public/SiteCard";
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
  const carouselRef = useRef<HTMLDivElement>(null);

  if (!pinnedStoreRef.current) {
    pinnedStoreRef.current = createPinnedStore();
  }

  const pinnedIds = useStore(pinnedStoreRef.current, (state) => state.pinnedIds);
  const togglePinned = useStore(pinnedStoreRef.current, (state) => state.togglePinned);

  const sortedCategories = useMemo(
    () => [...snapshot.categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [snapshot.categories],
  );

  const searchFiltered = useMemo(
    () => searchWebsites(snapshot.websites, query),
    [query, snapshot.websites],
  );

  const filteredWebsites = useMemo(() => {
    if (!activeCategoryId) return searchFiltered;
    return searchFiltered.filter((w) => w.categoryId === activeCategoryId);
  }, [activeCategoryId, searchFiltered]);

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  // Pinned only when "All" is selected
  const pinnedWebsites = useMemo(
    () => (!activeCategoryId ? snapshot.websites.filter((w) => pinnedSet.has(w.id)) : []),
    [pinnedSet, snapshot.websites, activeCategoryId],
  );

  const categoryNamesById = useMemo(
    () => Object.fromEntries(sortedCategories.map((c) => [c.id, c.name])),
    [sortedCategories],
  );

  const categoryCounts = useMemo(() => {
    return searchFiltered.reduce<Record<string, number>>((acc, w) => {
      acc[w.categoryId] = (acc[w.categoryId] ?? 0) + 1;
      return acc;
    }, {});
  }, [searchFiltered]);

  const groupedWebsites = useMemo(() => {
    return sortedCategories
      .map((cat) => ({
        category: cat,
        websites: filteredWebsites.filter((w) => w.categoryId === cat.id),
      }))
      .filter(({ websites }) => websites.length > 0);
  }, [sortedCategories, filteredWebsites]);

  // ── Drag-to-scroll for pinned carousel ──
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  function onCarouselMouseDown(e: React.MouseEvent) {
    const el = carouselRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = "grabbing";
  }

  function onCarouselMouseMove(e: React.MouseEvent) {
    if (!drag.current.active || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    carouselRef.current.scrollLeft = drag.current.scrollLeft - (x - drag.current.startX);
  }

  function onCarouselMouseUp() {
    drag.current.active = false;
    if (carouselRef.current) carouselRef.current.style.cursor = "grab";
  }

  return (
    <AppShell>
      {/* Theme toggle */}
      <div className="topbar-float">
        <PublicThemeButton />
      </div>

      <div className="page-layout">

        {/* ── Fixed header: search + chips only ── */}
        <header className="page-header">
          <label className="search-hero__bar" aria-label="Search sites">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l5 5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sites…"
              autoFocus
            />
            {query ? (
              <button type="button" className="search-hero__clear" aria-label="Clear" onClick={() => setQuery("")}>✕</button>
            ) : (
              <span className="search-hero__kbd">⌘K</span>
            )}
          </label>

          <div className="cat-chips" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`cat-chip${!activeCategoryId ? " is-active" : ""}`}
              onClick={() => setActiveCategoryId(null)}
            >
              All <span className="cat-chip__count">{searchFiltered.length}</span>
            </button>
            {sortedCategories.map((cat) => {
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`cat-chip${activeCategoryId === cat.id ? " is-active" : ""}${count === 0 ? " is-empty" : ""}`}
                  onClick={() => setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)}
                >
                  {cat.name}
                  {count > 0 && <span className="cat-chip__count">{count}</span>}
                </button>
              );
            })}
          </div>
        </header>

        {/* ── Pinned strip — outside scroll, drag horizontally ── */}
        {pinnedWebsites.length > 0 && (
          <div className="pinned-strip">
            <p className="section-heading">⭐ Pinned</p>
            <div
              ref={carouselRef}
              className="pinned-carousel"
              onMouseDown={onCarouselMouseDown}
              onMouseMove={onCarouselMouseMove}
              onMouseUp={onCarouselMouseUp}
              onMouseLeave={onCarouselMouseUp}
            >
              {pinnedWebsites.map((website) => (
                <PinCard
                  key={website.id}
                  website={website}
                  categoryName={categoryNamesById[website.categoryId] ?? "Uncategorized"}
                  onUnpin={togglePinned}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Scrollable directory ── */}
        <div className="page-scroll">
          <section className="directory">
            {groupedWebsites.length > 0 ? (
              groupedWebsites.map(({ category, websites }) => (
                <div key={category.id} className="dir-group" id={`cat-${category.id}`}>
                  <h2 className="dir-group__heading">{category.name}</h2>
                  <div className="dir-grid">
                    {websites.map((website) => (
                      <SiteCard
                        key={website.id}
                        website={website}
                        categoryName={category.name}
                        isPinned={pinnedSet.has(website.id)}
                        onTogglePinned={togglePinned}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <div className="no-results__icon">🌸</div>
                <h2 className="no-results__title">Nothing found</h2>
                <p className="no-results__sub">Try a different search term or clear the filter.</p>
              </div>
            )}
          </section>
        </div>

      </div>
    </AppShell>
  );
}
