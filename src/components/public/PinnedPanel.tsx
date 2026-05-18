import type { PublishedSnapshot } from "../../types/snapshot";
import { WebsiteRow } from "./WebsiteRow";

type PinnedPanelProps = {
  websites: PublishedSnapshot["websites"];
  categoryNamesById: Record<string, string>;
  pinnedIds: Set<string>;
  onTogglePinned: (id: string) => void;
};

export function PinnedPanel({ websites, categoryNamesById, pinnedIds, onTogglePinned }: PinnedPanelProps) {
  return (
    <section className="section-block">
      <div className="panel-title">
        <span className="panel-title__icon" aria-hidden="true">
          📌
        </span>
        <span>Pinned</span>
      </div>

      <div className="panel pinned-panel">
        {websites.length > 0 ? (
          <div className="website-list">
            {websites.map((website) => (
              <WebsiteRow
                key={website.id}
                website={website}
                categoryName={categoryNamesById[website.categoryId] ?? "Uncategorized"}
                isPinned={pinnedIds.has(website.id)}
                onTogglePinned={onTogglePinned}
              />
            ))}
          </div>
        ) : (
          <div className="pinned-empty">
            <div className="pinned-empty__inner">
              <div className="pinned-empty__badge" aria-hidden="true">
                📍
              </div>
              <h3>No pinned websites yet</h3>
              <p>When pinning is enabled, your selected websites will appear here for quick access.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
