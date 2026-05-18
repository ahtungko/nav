import type { PublishedSnapshot } from "../../types/snapshot";
import { WebsiteRow } from "./WebsiteRow";

type RecentPanelProps = {
  websites: PublishedSnapshot["websites"];
  categoryNamesById: Record<string, string>;
  pinnedIds: Set<string>;
  onTogglePinned: (id: string) => void;
};

export function RecentPanel({ websites, categoryNamesById, pinnedIds, onTogglePinned }: RecentPanelProps) {
  return (
    <aside className="section-block">
      <div className="panel-title">
        <span className="panel-title__icon" aria-hidden="true">
          ✨
        </span>
        <span>Recently Added</span>
      </div>

      <div className="panel recent-panel">
        {websites.length > 0 ? (
          <div className="website-list website-list--compact">
            {websites.map((website) => (
              <WebsiteRow
                key={website.id}
                compact
                website={website}
                categoryName={categoryNamesById[website.categoryId] ?? "Uncategorized"}
                isPinned={pinnedIds.has(website.id)}
                onTogglePinned={onTogglePinned}
              />
            ))}
          </div>
        ) : (
          <div className="empty-panel-message">No recently added websites match the current filters.</div>
        )}
      </div>
    </aside>
  );
}
