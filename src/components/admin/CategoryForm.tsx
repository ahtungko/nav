import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryIconClassName,
  getCategoryIconOption,
  renderCategoryIcon,
} from "../../lib/category-icons";

export type CategoryFormValues = {
  name: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  isVisible: boolean;
};

const DEFAULT_CATEGORY_ICON_KEY = CATEGORY_ICON_OPTIONS[0]!.key;

function normalizeIconKey(iconKey: string | null | undefined) {
  return CATEGORY_ICON_OPTIONS.find((option) => option.key === iconKey)?.key ?? DEFAULT_CATEGORY_ICON_KEY;
}

function slugifyCategoryName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

const emptyValues: CategoryFormValues = {
  name: "",
  slug: "",
  iconKey: DEFAULT_CATEGORY_ICON_KEY,
  sortOrder: 0,
  isVisible: true,
};

type CategoryFormProps = {
  selectedName?: string | null;
  initialValues?: CategoryFormValues | null;
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

function createFormValues(initialValues?: CategoryFormValues | null): CategoryFormValues {
  if (!initialValues) {
    return emptyValues;
  }

  return {
    ...initialValues,
    iconKey: normalizeIconKey(initialValues.iconKey),
  };
}

export function CategoryForm({ selectedName, initialValues, onSubmit, onCancel, submitLabel = "Save category" }: CategoryFormProps) {
  const [values, setValues] = useState<CategoryFormValues>(() => createFormValues(initialValues));
  const [hasManualSlugOverride, setHasManualSlugOverride] = useState(() => Boolean(initialValues?.slug));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const iconOptionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setValues(createFormValues(initialValues));
    setHasManualSlugOverride(Boolean(initialValues?.slug));
    setErrorMessage(null);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...values,
        iconKey: normalizeIconKey(values.iconKey),
      });
      if (!initialValues) {
        setValues(emptyValues);
        setHasManualSlugOverride(false);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectIcon(iconKey: string) {
    setValues((current) => ({ ...current, iconKey }));
  }

  function focusIcon(iconKey: string) {
    iconOptionRefs.current[iconKey]?.focus();
  }

  function moveSelection(nextIndex: number) {
    const normalizedIndex = (nextIndex + CATEGORY_ICON_OPTIONS.length) % CATEGORY_ICON_OPTIONS.length;
    const nextOption = CATEGORY_ICON_OPTIONS[normalizedIndex];

    if (!nextOption) {
      return;
    }

    selectIcon(nextOption.key);
    focusIcon(nextOption.key);
  }

  function handleIconKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown": {
        event.preventDefault();
        moveSelection(currentIndex + 1);
        break;
      }
      case "ArrowLeft":
      case "ArrowUp": {
        event.preventDefault();
        moveSelection(currentIndex - 1);
        break;
      }
      case "Home": {
        event.preventDefault();
        moveSelection(0);
        break;
      }
      case "End": {
        event.preventDefault();
        moveSelection(CATEGORY_ICON_OPTIONS.length - 1);
        break;
      }
      case " ":
      case "Enter": {
        event.preventDefault();
        selectIcon(CATEGORY_ICON_OPTIONS[currentIndex]!.key);
        break;
      }
      default:
        break;
    }
  }

  const selectedIcon = getCategoryIconOption(values.iconKey);

  return (
    <form className="admin-form admin-panel admin-editor-card" onSubmit={handleSubmit}>
      <div className="admin-form__header">
        <div>
          <h3>{selectedName ? `Editing ${selectedName}` : "Create category"}</h3>
          <p>
            {selectedName
              ? "Update naming, icon key, ordering, and visibility for the selected category."
              : "Start a new category in the draft workspace."}
          </p>
        </div>
      </div>

      <label className="admin-field">
        <span>Name</span>
        <input
          value={values.name}
          onChange={(event) => {
            const nextName = event.target.value;

            setValues((current) => ({
              ...current,
              name: nextName,
              slug: hasManualSlugOverride ? current.slug : slugifyCategoryName(nextName),
            }));
          }}
          placeholder="AI"
          required
        />
      </label>

      <label className="admin-field">
        <span>Slug</span>
        <input
          value={values.slug}
          onChange={(event) => {
            setHasManualSlugOverride(true);
            setValues((current) => ({ ...current, slug: event.target.value }));
          }}
          placeholder="ai"
          required
        />
      </label>

      <fieldset className="admin-field admin-icon-picker-fieldset">
        <legend id="category-icon-label">Category icon</legend>
        <input type="hidden" name="iconKey" value={values.iconKey} />
        <div className="admin-icon-preview" aria-live="polite">
          <span className={`category-card__icon ${getCategoryIconClassName(selectedIcon.key)}`}>{renderCategoryIcon(selectedIcon.key)}</span>
          <div>
            <strong>{selectedIcon.label}</strong>
            <p>Selected icon key: {selectedIcon.key}</p>
          </div>
        </div>
        <div className="admin-icon-picker" role="radiogroup" aria-labelledby="category-icon-label">
          {CATEGORY_ICON_OPTIONS.map((option, index) => {
            const isSelected = values.iconKey === option.key;
            const optionLabelId = `category-icon-option-${option.key}`;

            return (
              <button
                key={option.key}
                ref={(element) => {
                  iconOptionRefs.current[option.key] = element;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-labelledby={optionLabelId}
                tabIndex={isSelected ? 0 : -1}
                className={`admin-icon-option${isSelected ? " is-selected" : ""}`}
                onClick={() => selectIcon(option.key)}
                onKeyDown={(event) => handleIconKeyDown(event, index)}
              >
                <span className={`admin-icon-option__glyph category-card__icon ${getCategoryIconClassName(option.key)}`}>
                  {renderCategoryIcon(option.key)}
                </span>
                <span id={optionLabelId} className="admin-icon-option__label">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

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
            Create new
          </button>
        ) : null}
      </div>
    </form>
  );
}


