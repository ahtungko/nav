import { useEffect, useMemo, useState } from "react";
import { AdminTabs, type AdminTabId } from "../../components/admin/AdminTabs";
import { CategoriesTable } from "../../components/admin/CategoriesTable";
import { CategoryForm, type CategoryFormValues } from "../../components/admin/CategoryForm";
import { PublishPanel } from "../../components/admin/PublishPanel";
import { WebsiteForm, type WebsiteFormValues } from "../../components/admin/WebsiteForm";
import { WebsitesTable } from "../../components/admin/WebsitesTable";
import type { Category } from "../../types/category";
import type { Website } from "../../types/website";

type AdminPageProps = {
  categories: Category[];
  websites: Website[];
  publishMessage?: string | null;
  lastPublishedAt?: string | null;
  globalMessage?: string | null;
  onCreateCategory: (values: CategoryFormValues) => Promise<void>;
  onUpdateCategory: (categoryId: string, values: CategoryFormValues) => Promise<void>;
  onDeleteCategory: (category: Category) => Promise<void>;
  onToggleCategoryVisibility: (category: Category) => Promise<void>;
  onCreateWebsite: (values: WebsiteFormValues) => Promise<void>;
  onUpdateWebsite: (websiteId: string, values: WebsiteFormValues) => Promise<void>;
  onDeleteWebsite: (website: Website) => Promise<void>;
  onToggleWebsiteVisibility: (website: Website) => Promise<void>;
  onPublish: () => Promise<void>;
};

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

function sortWebsites(websites: Website[], categories: Category[]): Website[] {
  const categoryOrder = new Map(sortCategories(categories).map((category, index) => [category.id, index] as const));

  return [...websites].sort(
    (left, right) =>
      (categoryOrder.get(left.categoryId) ?? Number.MAX_SAFE_INTEGER) -
        (categoryOrder.get(right.categoryId) ?? Number.MAX_SAFE_INTEGER) ||
      left.sortOrder - right.sortOrder ||
      left.title.localeCompare(right.title),
  );
}

export function AdminPage({
  categories,
  websites,
  publishMessage,
  lastPublishedAt,
  globalMessage,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleCategoryVisibility,
  onCreateWebsite,
  onUpdateWebsite,
  onDeleteWebsite,
  onToggleWebsiteVisibility,
  onPublish,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [websiteQuery, setWebsiteQuery] = useState("");
  const [websiteCategoryFilter, setWebsiteCategoryFilter] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCategoryId && !categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (selectedWebsiteId && !websites.some((website) => website.id === selectedWebsiteId)) {
      setSelectedWebsiteId(null);
    }
  }, [selectedWebsiteId, websites]);

  const sortedCategories = useMemo(() => sortCategories(categories), [categories]);
  const sortedWebsites = useMemo(() => sortWebsites(websites, categories), [categories, websites]);

  const filteredCategories = useMemo(() => {
    const normalized = categoryQuery.trim().toLowerCase();
    if (!normalized) {
      return sortedCategories;
    }

    return sortedCategories.filter((category) => {
      return category.name.toLowerCase().includes(normalized) || category.slug.toLowerCase().includes(normalized);
    });
  }, [categoryQuery, sortedCategories]);

  const filteredWebsites = useMemo(() => {
    const normalized = websiteQuery.trim().toLowerCase();

    return sortedWebsites.filter((website) => {
      const matchesQuery =
        !normalized ||
        website.title.toLowerCase().includes(normalized) ||
        website.url.toLowerCase().includes(normalized);
      const matchesCategory = websiteCategoryFilter === "all" || website.categoryId === websiteCategoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [sortedWebsites, websiteCategoryFilter, websiteQuery]);

  const categoriesById = useMemo(() => {
    return Object.fromEntries(sortedCategories.map((category) => [category.id, category.name]));
  }, [sortedCategories]);

  const selectedCategory = useMemo(
    () => sortedCategories.find((category) => category.id === selectedCategoryId) ?? null,
    [selectedCategoryId, sortedCategories],
  );
  const selectedWebsite = useMemo(
    () => sortedWebsites.find((website) => website.id === selectedWebsiteId) ?? null,
    [selectedWebsiteId, sortedWebsites],
  );

  const visibleCategoryCount = sortedCategories.filter((category) => category.isVisible).length;
  const visibleWebsiteCount = sortedWebsites.filter((website) => website.isVisible).length;

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div>
          <p className="admin-hero__eyebrow">vyxolabs Admin</p>
          <h1>Manage categories, websites, and publish snapshots.</h1>
          <p>Draft changes stay in D1 until you publish a fresh `public-site:v1` snapshot.</p>
        </div>
        <div className="admin-hero__stats" aria-label="Admin summary">
          <article>
            <span>Categories</span>
            <strong>{sortedCategories.length}</strong>
          </article>
          <article>
            <span>Websites</span>
            <strong>{sortedWebsites.length}</strong>
          </article>
          <article>
            <span>Visible websites</span>
            <strong>{visibleWebsiteCount}</strong>
          </article>
        </div>
      </section>

      <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

      {globalMessage ? <p className="admin-feedback">{globalMessage}</p> : null}

      {activeTab === "overview" ? (
        <section className="admin-overview-grid">
          <article className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>Draft health</h3>
                <p>Quick snapshot of the current draft inventory.</p>
              </div>
            </div>
            <div className="admin-metrics">
              <article>
                <span>Total categories</span>
                <strong>{sortedCategories.length}</strong>
              </article>
              <article>
                <span>Visible categories</span>
                <strong>{visibleCategoryCount}</strong>
              </article>
              <article>
                <span>Total websites</span>
                <strong>{sortedWebsites.length}</strong>
              </article>
              <article>
                <span>Visible websites</span>
                <strong>{visibleWebsiteCount}</strong>
              </article>
            </div>
          </article>

          <PublishPanel
            categoryCount={visibleCategoryCount}
            websiteCount={visibleWebsiteCount}
            lastPublishedAt={lastPublishedAt}
            message={publishMessage}
            onPublish={onPublish}
          />
        </section>
      ) : null}

      {activeTab === "categories" ? (
        <section className="admin-section-grid">
          <div className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>Filter categories</h3>
                <p>Search by name or slug.</p>
              </div>
            </div>
            <label className="admin-field">
              <span>Search</span>
              <input value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder="Search categories" />
            </label>
          </div>

          <CategoryForm
            initialValues={
              selectedCategory
                ? {
                    name: selectedCategory.name,
                    slug: selectedCategory.slug,
                    iconKey: selectedCategory.iconKey,
                    sortOrder: selectedCategory.sortOrder,
                    isVisible: selectedCategory.isVisible,
                  }
                : null
            }
            submitLabel={selectedCategory ? "Update category" : "Create category"}
            onSubmit={async (values) => {
              if (selectedCategory) {
                await onUpdateCategory(selectedCategory.id, values);
              } else {
                await onCreateCategory(values);
              }
              setSelectedCategoryId(null);
            }}
            onCancel={selectedCategory ? () => setSelectedCategoryId(null) : undefined}
          />

          <CategoriesTable
            categories={filteredCategories}
            onEdit={(category) => setSelectedCategoryId(category.id)}
            onDelete={async (category) => {
              await onDeleteCategory(category);
              if (selectedCategoryId === category.id) {
                setSelectedCategoryId(null);
              }
            }}
            onToggleVisible={onToggleCategoryVisibility}
          />
        </section>
      ) : null}

      {activeTab === "websites" ? (
        <section className="admin-section-grid">
          <div className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>Filter websites</h3>
                <p>Search titles or URLs, and narrow by category.</p>
              </div>
            </div>
            <div className="admin-filter-grid">
              <label className="admin-field">
                <span>Search</span>
                <input value={websiteQuery} onChange={(event) => setWebsiteQuery(event.target.value)} placeholder="Search websites" />
              </label>
              <label className="admin-field">
                <span>Category</span>
                <select value={websiteCategoryFilter} onChange={(event) => setWebsiteCategoryFilter(event.target.value)}>
                  <option value="all">All categories</option>
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <WebsiteForm
            categories={sortedCategories}
            initialValues={
              selectedWebsite
                ? {
                    title: selectedWebsite.title,
                    url: selectedWebsite.url,
                    categoryId: selectedWebsite.categoryId,
                    sortOrder: selectedWebsite.sortOrder,
                    isVisible: selectedWebsite.isVisible,
                  }
                : null
            }
            submitLabel={selectedWebsite ? "Update website" : "Create website"}
            onSubmit={async (values) => {
              if (selectedWebsite) {
                await onUpdateWebsite(selectedWebsite.id, values);
              } else {
                await onCreateWebsite(values);
              }
              setSelectedWebsiteId(null);
            }}
            onCancel={selectedWebsite ? () => setSelectedWebsiteId(null) : undefined}
          />

          <WebsitesTable
            websites={filteredWebsites}
            categoriesById={categoriesById}
            onEdit={(website) => setSelectedWebsiteId(website.id)}
            onDelete={async (website) => {
              await onDeleteWebsite(website);
              if (selectedWebsiteId === website.id) {
                setSelectedWebsiteId(null);
              }
            }}
            onToggleVisible={onToggleWebsiteVisibility}
          />
        </section>
      ) : null}

      {activeTab === "publish" ? (
        <PublishPanel
          categoryCount={visibleCategoryCount}
          websiteCount={visibleWebsiteCount}
          lastPublishedAt={lastPublishedAt}
          message={publishMessage}
          onPublish={onPublish}
        />
      ) : null}
    </main>
  );
}
