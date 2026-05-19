import { getWebsiteFaviconUrl } from "../../lib/favicon";
import type { PublishedSnapshot } from "../../types/snapshot";

type SiteCardProps = {
  website: PublishedSnapshot["websites"][number];
  categoryName: string;
  isPinned: boolean;
  onTogglePinned: (id: string) => void;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SiteCard({ website, categoryName, isPinned, onTogglePinned }: SiteCardProps) {
  const hostname = getHostname(website.url);

  return (
    <div className="site-card">
      <div className="site-card__icon">
        <img
          src={getWebsiteFaviconUrl({ url: website.url, faviconUrl: website.faviconUrl })}
          alt=""
          loading="lazy"
        />
      </div>

      <a className="site-card__body" href={website.url} target="_blank" rel="noreferrer">
        <span className="site-card__title">{website.title}</span>
        <span className="site-card__domain">{hostname}</span>
      </a>

      <div className="site-card__actions">
        <button
          type="button"
          className={`pin-btn${isPinned ? " is-active" : ""}`}
          aria-pressed={isPinned}
          aria-label={isPinned ? `Unpin ${website.title}` : `Pin ${website.title}`}
          onClick={() => onTogglePinned(website.id)}
        >
          {isPinned ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}
