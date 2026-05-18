import { type FormEvent, useEffect, useState } from "react";
import type { Category } from "../../types/category";

export type WebsiteFormValues = {
  title: string;
  url: string;
  categoryId: string;
  sortOrder: number;
  isVisible: boolean;
};

const emptyValues: WebsiteFormValues = {
  title: "",
  url: "https://",
  categoryId: "",
  sortOrder: 0,
  isVisible: true,
};

type WebsiteFormProps = {
  categories: Category[];
  initialValues?: WebsiteFormValues | null;
  onSubmit: (values: WebsiteFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function WebsiteForm({
  categories,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save website",
}: WebsiteFormProps) {
  const [values, setValues] = useState<WebsiteFormValues>(initialValues ?? emptyValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(
      initialValues ?? {
        ...emptyValues,
        categoryId: categories[0]?.id ?? "",
      },
    );
    setErrorMessage(null);
  }, [categories, initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
      if (!initialValues) {
        setValues({
          ...emptyValues,
          categoryId: categories[0]?.id ?? "",
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the website.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-form admin-panel" onSubmit={handleSubmit}>
      <div className="admin-form__header">
        <div>
          <h3>{initialValues ? "Edit website" : "New website"}</h3>
          <p>Choose the category, order, link, and draft visibility.</p>
        </div>
      </div>

      <label className="admin-field">
        <span>Title</span>
        <input
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          placeholder="ChatGPT"
          required
        />
      </label>

      <label className="admin-field">
        <span>URL</span>
        <input
          type="url"
          value={values.url}
          onChange={(event) => setValues((current) => ({ ...current, url: event.target.value }))}
          placeholder="https://chatgpt.com"
          required
        />
      </label>

      <label className="admin-field">
        <span>Category</span>
        <select
          value={values.categoryId}
          onChange={(event) => setValues((current) => ({ ...current, categoryId: event.target.value }))}
          required
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="admin-field">
        <span>Sort order</span>
        <input
          type="number"
          value={values.sortOrder}
          onChange={(event) => setValues((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
          required
        />
      </label>

      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={values.isVisible}
          onChange={(event) => setValues((current) => ({ ...current, isVisible: event.target.checked }))}
        />
        <span>Visible in the published snapshot</span>
      </label>

      {errorMessage ? <p className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}

      <div className="admin-form__actions">
        <button type="submit" className="admin-button admin-button--primary" disabled={isSubmitting || categories.length === 0}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="admin-button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

