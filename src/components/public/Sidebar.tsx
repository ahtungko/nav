import type { PublishedSnapshot } from "../../types/snapshot";

type SidebarProps = {
  categories: PublishedSnapshot["categories"];
  categoryCounts: Record<string, number>;
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  totalCount: number;
};

export function Sidebar({
  categories,
  categoryCounts,
  activeCategoryId,
  onSelectCategory,
  totalCount,
}: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="Site navigation">
      <a className="sidebar__logo" href="/" aria-label="Go to homepage">
        <span className="sidebar__logo-icon" aria-hidden="true">🌸</span>
        <span className="sidebar__logo-text">
          vyxo<span>labs</span>
        </span>
      </a>

      <div className="sidebar__nav">
        <span className="sidebar__section-label">Browse</span>

        <button
          className={`sidebar__category${!activeCategoryId ? " is-active" : ""}`}
          onClick={() => onSelectCategory(null)}
          type="button"
        >
          <span className="sidebar__category-dot" />
          <span className="sidebar__category-name">All Sites</span>
          <span className="sidebar__category-count">{totalCount}</span>
        </button>

        {categories.map((category) => {
          const count = categoryCounts[category.id] ?? 0;
          return (
            <button
              key={category.id}
              className={`sidebar__category${activeCategoryId === category.id ? " is-active" : ""}`}
              onClick={() => onSelectCategory(activeCategoryId === category.id ? null : category.id)}
              type="button"
            >
              <span className="sidebar__category-dot" />
              <span className="sidebar__category-name">{category.name}</span>
              {count > 0 && <span className="sidebar__category-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="sidebar__footer">
        <span className="sidebar__footer-text">© 2026 vyxolabs</span>
      </div>
    </nav>
  );
}
