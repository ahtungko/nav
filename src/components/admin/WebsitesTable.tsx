import type { Website } from "../../types/website";

type WebsitesTableProps = {
  websites: Website[];
  categoriesById: Record<string, string>;
  onEdit: (website: Website) => void;
  onDelete: (website: Website) => Promise<void> | void;
  onToggleVisible: (website: Website) => Promise<void> | void;
};

export function WebsitesTable({ websites, categoriesById, onEdit, onDelete, onToggleVisible }: WebsitesTableProps) {
  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h3>Websites</h3>
          <p>Manage titles, categories, sorting, and publish visibility.</p>
        </div>
        <span className="admin-chip">{websites.length}</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>URL</th>
              <th>Order</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {websites.length > 0 ? (
              websites.map((website) => (
                <tr key={website.id}>
                  <td>{website.title}</td>
                  <td>{categoriesById[website.categoryId] ?? website.categoryId}</td>
                  <td className="admin-table__url">{website.url}</td>
                  <td>{website.sortOrder}</td>
                  <td>{website.isVisible ? "Yes" : "No"}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button type="button" className="admin-button admin-button--small" onClick={() => onEdit(website)}>
                        Edit
                      </button>
                      <button type="button" className="admin-button admin-button--small" onClick={() => onToggleVisible(website)}>
                        {website.isVisible ? "Hide" : "Show"}
                      </button>
                      <button type="button" className="admin-button admin-button--small admin-button--danger" onClick={() => onDelete(website)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  No websites match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
