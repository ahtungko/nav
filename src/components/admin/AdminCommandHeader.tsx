type AdminCommandHeaderProps = {
  categoryCount: number;
  websiteCount: number;
  visibleCategoryCount: number;
  visibleWebsiteCount: number;
  lastPublishedAt?: string | null;
  onPublish: () => Promise<void> | void;
};

export function AdminCommandHeader({
  categoryCount,
  websiteCount,
  visibleCategoryCount,
  visibleWebsiteCount,
  lastPublishedAt,
  onPublish,
}: AdminCommandHeaderProps) {
  return (
    <section className="admin-command-header">
      <div className="admin-command-header__copy">
        <p className="admin-command-header__eyebrow">vyxolabs Admin</p>
        <h1>Draft command center</h1>
        <p>Manage draft categories, tune website visibility, and release a new public snapshot when the workspace is ready.</p>
      </div>

      <div className="admin-command-header__release">
        <p className="admin-command-header__release-label">
          {lastPublishedAt ? `Last publish: ${new Date(lastPublishedAt).toLocaleString()}` : "No publish recorded in this session yet."}
        </p>
        <button type="button" className="admin-button admin-button--primary" onClick={() => void onPublish()}>
          Publish now
        </button>
      </div>

      <div className="admin-command-header__metrics" aria-label="Admin summary">
        <article>
          <span>Categories</span>
          <strong>{categoryCount}</strong>
        </article>
        <article>
          <span>Visible categories</span>
          <strong>{visibleCategoryCount}</strong>
        </article>
        <article>
          <span>Websites</span>
          <strong>{websiteCount}</strong>
        </article>
        <article>
          <span>Visible websites</span>
          <strong>{visibleWebsiteCount}</strong>
        </article>
      </div>
    </section>
  );
}
