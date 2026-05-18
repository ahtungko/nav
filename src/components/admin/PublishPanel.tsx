import { AdminStatusBanner, type AdminFeedback } from "./AdminStatusBanner";

type PublishPanelProps = {
  categoryCount: number;
  websiteCount: number;
  lastPublishedAt?: string | null;
  feedback?: AdminFeedback | null;
  onPublish: () => Promise<void> | void;
};

export function PublishPanel({ categoryCount, websiteCount, lastPublishedAt, feedback, onPublish }: PublishPanelProps) {
  return (
    <section className="admin-panel admin-panel--publish">
      <div className="admin-panel__header">
        <div>
          <h2>Release draft snapshot</h2>
          <p>Write the currently visible draft rows into the public KV snapshot that powers the homepage.</p>
        </div>
      </div>

      <div className="admin-metrics">
        <article>
          <span>Visible categories</span>
          <strong>{categoryCount}</strong>
        </article>
        <article>
          <span>Visible websites</span>
          <strong>{websiteCount}</strong>
        </article>
      </div>

      <div className="admin-publish__meta">
        <p>{lastPublishedAt ? `Last publish: ${new Date(lastPublishedAt).toLocaleString()}` : "No publish has been triggered yet."}</p>
        <AdminStatusBanner feedback={feedback} />
      </div>

      <button type="button" className="admin-button admin-button--primary" onClick={() => void onPublish()}>
        Publish snapshot
      </button>
    </section>
  );
}
