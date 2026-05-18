import { useEffect, useMemo, useState } from "react";
import { AdminCommandHeader } from "../../components/admin/AdminCommandHeader";
import { AdminStatusBanner, type AdminFeedback } from "../../components/admin/AdminStatusBanner";
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
  publishFeedback?: AdminFeedback | null;
  lastPublishedAt?: string | null;
  globalFeedback?: AdminFeedback | null;
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
  publishFeedback,
  lastPublishedAt,
  globalFeedback,
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
    <div className="admin-command-center">
      <AdminCommandHeader
        categoryCount={sortedCategories.length}
        websiteCount={sortedWebsites.length}
        visibleCategoryCount={visibleCategoryCount}
        visibleWebsiteCount={visibleWebsiteCount}
        lastPublishedAt={lastPublishedAt}
        onPublish={onPublish}
      />

      <AdminStatusBanner feedback={globalFeedback} />
      <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <section className="admin-overview-grid">
          <article className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h2>Workspace overview</h2>
                <p>Review draft health before moving into category, website, or publish workflows.</p>
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
            feedback={publishFeedback}
            onPublish={onPublish}
          />
        </section>
      ) : null}

      {activeTab === "categories" ? (
        <section className="admin-workspace-grid">
          <div className="admin-workspace-grid__main">
            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h2>Category workspace</h2>
                  <p>Search draft categories, then edit the selected row in the sticky side panel.</p>
                </div>
              </div>

              <label className="admin-field">
                <span>Search</span>
                <input value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder="Search categories" />
              </label>
            </article>

            <CategoriesTable
              categories={filteredCategories}
              selectedCategoryId={selectedCategoryId}
              onEdit={(category) => setSelectedCategoryId(category.id)}
              onDelete={async (category) => {
                await onDeleteCategory(category);
                if (selectedCategoryId === category.id) {
                  setSelectedCategoryId(null);
                }
              }}
              onToggleVisible={onToggleCategoryVisibility}
            />
          </div>

          <div className="admin-workspace-grid__sidebar">
            <CategoryForm
              selectedName={selectedCategory?.name ?? null}
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
              submitLabel={selectedCategory ? "Save category" : "Create category"}
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
          </div>
        </section>
      ) : null}

      {activeTab === "websites" ? (
        <section className="admin-workspace-grid">
          <div className="admin-workspace-grid__main">
            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h2>Website workspace</h2>
                  <p>Search titles or URLs, narrow by category, then update the selected row in the editor.</p>
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
            </article>

            <WebsitesTable
              websites={filteredWebsites}
              selectedWebsiteId={selectedWebsiteId}
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
          </div>

          <div className="admin-workspace-grid__sidebar">
            <WebsiteForm
              categories={sortedCategories}
              selectedTitle={selectedWebsite?.title ?? null}
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
              submitLabel={selectedWebsite ? "Save website" : "Create website"}
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
          </div>
        </section>
      ) : null}

      {activeTab === "publish" ? (
        <PublishPanel
          categoryCount={visibleCategoryCount}
          websiteCount={visibleWebsiteCount}
          lastPublishedAt={lastPublishedAt}
          feedback={publishFeedback}
          onPublish={onPublish}
        />
      ) : null}
    </div>
  );
}
