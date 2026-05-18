import { getWebsiteFaviconUrl } from "../../lib/favicon";
import type { PublishedSnapshot } from "../../types/snapshot";

type WebsiteRowProps = {
  website: PublishedSnapshot["websites"][number];
  categoryName: string;
  isPinned: boolean;
  onTogglePinned: (id: string) => void;
  compact?: boolean;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function WebsiteRow({ website, categoryName, isPinned, onTogglePinned, compact = false }: WebsiteRowProps) {
  const hostname = getHostname(website.url);

  return (
    <article className={`website-row${compact ? " website-row--compact" : ""}`}>
      <div className="website-row__brand" aria-hidden="true">
        <img src={getWebsiteFaviconUrl({ url: website.url, faviconUrl: website.faviconUrl })} alt="" loading="lazy" />
      </div>

      <div className="website-row__body">
        <a className="website-row__title" href={website.url} target="_blank" rel="noreferrer">
          {website.title}
        </a>
        <div className="website-row__meta">{hostname}</div>
      </div>

      <div className="website-row__actions">
        <span className="website-row__tag">{categoryName}</span>
        <button
          type="button"
          className={`pin-toggle${isPinned ? " is-active" : ""}`}
          aria-pressed={isPinned}
          aria-label={isPinned ? `Unpin ${website.title}` : `Pin ${website.title}`}
          onClick={() => onTogglePinned(website.id)}
        >
          {isPinned ? "Pinned" : "Pin"}
        </button>
      </div>
    </article>
  );
}
