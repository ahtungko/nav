type PublishPanelProps = {
  categoryCount: number;
  websiteCount: number;
  lastPublishedAt?: string | null;
  message?: string | null;
  onPublish: () => Promise<void> | void;
};

export function PublishPanel({ categoryCount, websiteCount, lastPublishedAt, message, onPublish }: PublishPanelProps) {
  return (
    <section className="admin-panel admin-panel--publish">
      <div className="admin-panel__header">
        <div>
          <h3>Publish snapshot</h3>
          <p>Write the current visible draft rows into the public KV snapshot.</p>
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
        {message ? <p className="admin-feedback">{message}</p> : null}
      </div>

      <button type="button" className="admin-button admin-button--primary" onClick={() => void onPublish()}>
        Publish snapshot
      </button>
    </section>
  );
}
