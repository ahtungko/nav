import { useCallback, useEffect, useState } from "react";
import { AdminPage } from "../app/admin/AdminPage";
import { LoginPage } from "../app/admin/LoginPage";
import type { CategoryFormValues } from "../components/admin/CategoryForm";
import type { WebsiteFormValues } from "../components/admin/WebsiteForm";
import { fetchJson, FetchJsonError } from "../lib/fetcher";
import type { Category } from "../types/category";
import type { Website } from "../types/website";

type PublishResponse = {
  publishedAt: string;
  categoryCount: number;
  websiteCount: number;
};

type ApiErrorPayload = {
  error?: string;
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

function getFriendlyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchJsonError<ApiErrorPayload>) {
    if (error.status === 401) {
      if (error.data?.error === "invalid_credentials") {
        return "Incorrect password. Please try again.";
      }

      return "Your admin session has expired. Please log in again.";
    }

    if (error.status === 409) {
      switch (error.data?.error) {
        case "category_has_websites":
          return "This category still has websites. Move or remove its websites first.";
        case "duplicate_category":
          return "Another category already uses this slug.";
        case "duplicate_website":
          return "A website with the same unique draft values already exists.";
        default:
          return "This action conflicts with the current draft state.";
      }
    }

    if (error.status === 400) {
      switch (error.data?.error) {
        case "invalid_category":
          return "Select a valid category before saving this website.";
        default:
          return "The form data is invalid. Please review the fields and try again.";
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function AdminRoute() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [status, setStatus] = useState<"loading" | "unauthenticated" | "ready">("loading");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const forceRelogin = useCallback((message: string | null) => {
    setCategories([]);
    setWebsites([]);
    setGlobalMessage(null);
    setPublishMessage(null);
    setLoginError(message);
    setStatus("unauthenticated");
  }, []);

  const loadAdminData = useCallback(async () => {
    setStatus("loading");
    setGlobalMessage(null);

    try {
      const nextCategories = await fetchJson<Category[]>("/api/admin/categories");
      const nextWebsites = await fetchJson<Website[]>("/api/admin/websites");
      setCategories(sortCategories(nextCategories));
      setWebsites(sortWebsites(nextWebsites, nextCategories));
      setStatus("ready");
    } catch (error) {
      const message = getFriendlyErrorMessage(error, "Unable to load admin data.");

      if (error instanceof FetchJsonError && error.status === 401) {
        forceRelogin(null);
        return;
      }

      setStatus("ready");
      setGlobalMessage(message);
    }
  }, [forceRelogin]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  async function runMutation<T>(options: {
    action: () => Promise<T>;
    fallbackMessage: string;
    successMessage?: string;
    onSuccess?: (value: T) => void;
    rethrow?: boolean;
    setFeedback?: (message: string | null) => void;
  }): Promise<T | undefined> {
    try {
      const result = await options.action();
      options.onSuccess?.(result);

      if (options.successMessage) {
        if (options.setFeedback) {
          options.setFeedback(options.successMessage);
        } else {
          setGlobalMessage(options.successMessage);
        }
      }

      return result;
    } catch (error) {
      const message = getFriendlyErrorMessage(error, options.fallbackMessage);

      if (error instanceof FetchJsonError && error.status === 401) {
        forceRelogin(message);
        return undefined;
      }

      if (options.rethrow) {
        throw new Error(message);
      }

      if (options.setFeedback) {
        options.setFeedback(message);
      } else {
        setGlobalMessage(message);
      }

      return undefined;
    }
  }

  async function handleLogin(password: string) {
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      await fetchJson<void>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      await loadAdminData();
    } catch (error) {
      setLoginError(getFriendlyErrorMessage(error, "Login failed."));
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleCreateCategory(values: CategoryFormValues) {
    await runMutation({
      action: () => fetchJson<Category>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(values),
      }),
      fallbackMessage: "Unable to save the category.",
      successMessage: `Saved category ${values.name}.`,
      onSuccess: (created) => {
        setCategories((current) => sortCategories([...current, created]));
      },
      rethrow: true,
    });
  }

  async function handleUpdateCategory(categoryId: string, values: CategoryFormValues) {
    await runMutation({
      action: () => fetchJson<Category>(`/api/admin/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify(values),
      }),
      fallbackMessage: "Unable to update the category.",
      successMessage: `Updated category ${values.name}.`,
      onSuccess: (updated) => {
        setCategories((current) => sortCategories(current.map((category) => (category.id === categoryId ? updated : category))));
      },
      rethrow: true,
    });
  }

  async function handleDeleteCategory(category: Category) {
    await runMutation({
      action: () => fetchJson<void>(`/api/admin/categories/${category.id}`, { method: "DELETE" }),
      fallbackMessage: "Unable to delete the category.",
      successMessage: `Deleted category ${category.name}.`,
      onSuccess: () => {
        setCategories((current) => sortCategories(current.filter((item) => item.id !== category.id)));
      },
    });
  }

  async function handleToggleCategoryVisibility(category: Category) {
    await runMutation({
      action: () => fetchJson<Category>(`/api/admin/categories/${category.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: category.name,
          slug: category.slug,
          iconKey: category.iconKey,
          sortOrder: category.sortOrder,
          isVisible: !category.isVisible,
        }),
      }),
      fallbackMessage: "Unable to update the category visibility.",
      successMessage: `Updated category ${category.name}.`,
      onSuccess: (updated) => {
        setCategories((current) => sortCategories(current.map((item) => (item.id === category.id ? updated : item))));
      },
    });
  }

  async function handleCreateWebsite(values: WebsiteFormValues) {
    await runMutation({
      action: () => fetchJson<Website>("/api/admin/websites", {
        method: "POST",
        body: JSON.stringify(values),
      }),
      fallbackMessage: "Unable to save the website.",
      successMessage: `Saved website ${values.title}.`,
      onSuccess: (created) => {
        setWebsites((current) => sortWebsites([...current, created], categories));
      },
      rethrow: true,
    });
  }

  async function handleUpdateWebsite(websiteId: string, values: WebsiteFormValues) {
    await runMutation({
      action: () => fetchJson<Website>(`/api/admin/websites/${websiteId}`, {
        method: "PUT",
        body: JSON.stringify(values),
      }),
      fallbackMessage: "Unable to update the website.",
      successMessage: `Updated website ${values.title}.`,
      onSuccess: (updated) => {
        setWebsites((current) => sortWebsites(current.map((website) => (website.id === websiteId ? updated : website)), categories));
      },
      rethrow: true,
    });
  }

  async function handleDeleteWebsite(website: Website) {
    await runMutation({
      action: () => fetchJson<void>(`/api/admin/websites/${website.id}`, { method: "DELETE" }),
      fallbackMessage: "Unable to delete the website.",
      successMessage: `Deleted website ${website.title}.`,
      onSuccess: () => {
        setWebsites((current) => sortWebsites(current.filter((item) => item.id !== website.id), categories));
      },
    });
  }

  async function handleToggleWebsiteVisibility(website: Website) {
    await runMutation({
      action: () => fetchJson<Website>(`/api/admin/websites/${website.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: website.title,
          url: website.url,
          categoryId: website.categoryId,
          sortOrder: website.sortOrder,
          isVisible: !website.isVisible,
        }),
      }),
      fallbackMessage: "Unable to update the website visibility.",
      successMessage: `Updated website ${website.title}.`,
      onSuccess: (updated) => {
        setWebsites((current) => sortWebsites(current.map((item) => (item.id === website.id ? updated : item)), categories));
      },
    });
  }

  async function handlePublish() {
    await runMutation({
      action: () => fetchJson<PublishResponse>("/api/admin/publish", { method: "POST" }),
      fallbackMessage: "Unable to publish the current snapshot.",
      onSuccess: (result) => {
        setLastPublishedAt(result.publishedAt);
        setPublishMessage(`Published ${result.categoryCount} categories and ${result.websiteCount} websites.`);
        setGlobalMessage("The public snapshot has been updated.");
      },
      setFeedback: setPublishMessage,
    });
  }

  if (status === "loading") {
    return (
      <main className="admin-auth-shell">
        <section className="admin-auth-card">
          <h1>Loading admin workspace...</h1>
          <p>Checking the current admin session.</p>
        </section>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <LoginPage errorMessage={loginError} isSubmitting={isLoggingIn} onLogin={handleLogin} />;
  }

  return (
    <AdminPage
      categories={categories}
      websites={websites}
      publishMessage={publishMessage}
      lastPublishedAt={lastPublishedAt}
      globalMessage={globalMessage}
      onCreateCategory={handleCreateCategory}
      onUpdateCategory={handleUpdateCategory}
      onDeleteCategory={handleDeleteCategory}
      onToggleCategoryVisibility={handleToggleCategoryVisibility}
      onCreateWebsite={handleCreateWebsite}
      onUpdateWebsite={handleUpdateWebsite}
      onDeleteWebsite={handleDeleteWebsite}
      onToggleWebsiteVisibility={handleToggleWebsiteVisibility}
      onPublish={handlePublish}
    />
  );
}
