import type { Category } from "../../types/category";

type CategoriesTableProps = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => Promise<void> | void;
  onToggleVisible: (category: Category) => Promise<void> | void;
};

export function CategoriesTable({ categories, onEdit, onDelete, onToggleVisible }: CategoriesTableProps) {
  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h3>Categories</h3>
          <p>Draft categories are ordered by sort order, then name.</p>
        </div>
        <span className="admin-chip">{categories.length}</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Icon</th>
              <th>Order</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.iconKey}</td>
                  <td>{category.sortOrder}</td>
                  <td>{category.isVisible ? "Yes" : "No"}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button type="button" className="admin-button admin-button--small" onClick={() => onEdit(category)}>
                        Edit
                      </button>
                      <button type="button" className="admin-button admin-button--small" onClick={() => onToggleVisible(category)}>
                        {category.isVisible ? "Hide" : "Show"}
                      </button>
                      <button type="button" className="admin-button admin-button--small admin-button--danger" onClick={() => onDelete(category)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  No categories match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
