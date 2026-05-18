import { type FormEvent, useEffect, useState } from "react";

export type CategoryFormValues = {
  name: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  isVisible: boolean;
};

const emptyValues: CategoryFormValues = {
  name: "",
  slug: "",
  iconKey: "",
  sortOrder: 0,
  isVisible: true,
};

type CategoryFormProps = {
  initialValues?: CategoryFormValues | null;
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function CategoryForm({ initialValues, onSubmit, onCancel, submitLabel = "Save category" }: CategoryFormProps) {
  const [values, setValues] = useState<CategoryFormValues>(initialValues ?? emptyValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(initialValues ?? emptyValues);
    setErrorMessage(null);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
      if (!initialValues) {
        setValues(emptyValues);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-form admin-panel" onSubmit={handleSubmit}>
      <div className="admin-form__header">
        <div>
          <h3>{initialValues ? "Edit category" : "New category"}</h3>
          <p>Manage the category label, icon key, order, and visibility.</p>
        </div>
      </div>

      <label className="admin-field">
        <span>Name</span>
        <input
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          placeholder="AI"
          required
        />
      </label>

      <label className="admin-field">
        <span>Slug</span>
        <input
          value={values.slug}
          onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))}
          placeholder="ai"
          required
        />
      </label>

      <label className="admin-field">
        <span>Icon key</span>
        <input
          value={values.iconKey}
          onChange={(event) => setValues((current) => ({ ...current, iconKey: event.target.value }))}
          placeholder="sparkles"
          required
        />
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
        <span>Visible in the admin draft and publish snapshot</span>
      </label>

      {errorMessage ? <p className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}

      <div className="admin-form__actions">
        <button type="submit" className="admin-button admin-button--primary" disabled={isSubmitting}>
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

