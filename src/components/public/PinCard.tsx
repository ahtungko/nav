import { getWebsiteFaviconUrl } from "../../lib/favicon";
import type { PublishedSnapshot } from "../../types/snapshot";

type PinCardProps = {
  website: PublishedSnapshot["websites"][number];
  categoryName: string;
  onUnpin: (id: string) => void;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function PinCard({ website, categoryName, onUnpin }: PinCardProps) {
  const hostname = getHostname(website.url);

  return (
    <div className="pin-card">
      <div className="pin-card__header">
        <div className="pin-card__icon">
          <img
            src={getWebsiteFaviconUrl({ url: website.url, faviconUrl: website.faviconUrl })}
            alt=""
            loading="lazy"
          />
        </div>
        <button
          type="button"
          className="pin-card__unpin"
          aria-label={`Unpin ${website.title}`}
          onClick={() => onUnpin(website.id)}
          title="Unpin"
        >
          ★
        </button>
      </div>

      <a href={website.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
        <p className="pin-card__title">{website.title}</p>
        <p className="pin-card__domain">{hostname}</p>
      </a>

      <span className="pin-card__tag">{categoryName}</span>
    </div>
  );
}
