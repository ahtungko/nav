import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryIconClassName,
  getCategoryIconDisplayLabel,
  renderCategoryIcon,
} from "../../lib/category-icons";
import {
  DEFAULT_CATEGORY_ICON_KEY,
  isBuiltInCategoryIconKey,
  isValidIconifyIconId,
  resolveCategoryIconKey,
  splitCategoryIconValue,
} from "../../lib/category-icon-registry";

export type CategoryFormValues = {
  name: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  isVisible: boolean;
};

type CategoryFormState = {
  name: string;
  slug: string;
  sortOrder: number;
  isVisible: boolean;
  builtInIconKey: string;
  customIconifyIconId: string;
};

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

function createFormState(initialValues?: CategoryFormValues | null): CategoryFormState {
  if (!initialValues) {
    return {
      name: emptyValues.name,
      slug: emptyValues.slug,
      sortOrder: emptyValues.sortOrder,
      isVisible: emptyValues.isVisible,
      builtInIconKey: DEFAULT_CATEGORY_ICON_KEY,
      customIconifyIconId: "",
    };
  }

  const { builtInIconKey, customIconifyIconId } = splitCategoryIconValue(initialValues.iconKey);

  return {
    name: initialValues.name,
    slug: initialValues.slug,
    sortOrder: initialValues.sortOrder,
    isVisible: initialValues.isVisible,
    builtInIconKey,
    customIconifyIconId,
  };
}

function getCustomIconifyValidationMessage(customIconifyIconId: string) {
  if (!customIconifyIconId) {
    return null;
  }

  return isValidIconifyIconId(customIconifyIconId) ? null : "Enter a valid Iconify ID like mdi:home.";
}

function getUntouchedLegacyIconKey(initialValues?: CategoryFormValues | null) {
  const iconKey = initialValues?.iconKey?.trim();

  if (!iconKey || isBuiltInCategoryIconKey(iconKey) || isValidIconifyIconId(iconKey)) {
    return null;
  }

  return iconKey;
}

export function CategoryForm({ selectedName, initialValues, onSubmit, onCancel, submitLabel = "Save category" }: CategoryFormProps) {
  const [values, setValues] = useState<CategoryFormState>(() => createFormState(initialValues));
  const [hasManualSlugOverride, setHasManualSlugOverride] = useState(() => Boolean(initialValues?.slug));
  const [hasTouchedIconControls, setHasTouchedIconControls] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const iconOptionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const customIconifyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValues(createFormState(initialValues));
    setHasManualSlugOverride(Boolean(initialValues?.slug));
    setHasTouchedIconControls(false);
    setErrorMessage(null);
  }, [initialValues]);

  const customIconifyValidationMessage = getCustomIconifyValidationMessage(values.customIconifyIconId);
  const untouchedLegacyIconKey = !hasTouchedIconControls ? getUntouchedLegacyIconKey(initialValues) : null;
  const resolvedIconKey = resolveCategoryIconKey(values.builtInIconKey, values.customIconifyIconId);
  const effectiveIconKey = untouchedLegacyIconKey ?? resolvedIconKey;
  const effectiveIconSource = untouchedLegacyIconKey
    ? "Existing saved legacy icon"
    : isValidIconifyIconId(values.customIconifyIconId)
      ? "Custom Iconify ID"
      : "Built-in picker";
  const effectiveIconLabel = getCategoryIconDisplayLabel(effectiveIconKey);
  const customIconifyErrorId = customIconifyValidationMessage ? "category-custom-iconify-feedback" : undefined;
  const customIconifyDescribedBy = ["category-custom-iconify-help", customIconifyErrorId].filter(Boolean).join(" ");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (customIconifyValidationMessage) {
      customIconifyInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: values.name,
        slug: values.slug,
        iconKey: effectiveIconKey,
        sortOrder: values.sortOrder,
        isVisible: values.isVisible,
      });
      if (!initialValues) {
        setValues(createFormState(null));
        setHasManualSlugOverride(false);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectIcon(builtInIconKey: string) {
    setHasTouchedIconControls(true);
    setValues((current) => ({ ...current, builtInIconKey }));
  }

  function focusIcon(builtInIconKey: string) {
    iconOptionRefs.current[builtInIconKey]?.focus();
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
        <input type="hidden" name="iconKey" value={effectiveIconKey} />
        <div className="admin-icon-preview" aria-live="polite">
          <span className={`category-card__icon ${getCategoryIconClassName(effectiveIconKey)}`}>{renderCategoryIcon(effectiveIconKey)}</span>
          <div>
            <strong>{effectiveIconLabel}</strong>
            <p>Preview source: {effectiveIconSource}</p>
            <p>Effective icon key: {effectiveIconKey}</p>
          </div>
        </div>
        <div className="admin-icon-picker" role="radiogroup" aria-labelledby="category-icon-label">
          {CATEGORY_ICON_OPTIONS.map((option, index) => {
            const isSelected = values.builtInIconKey === option.key;
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
        <span>Custom Iconify ID</span>
        <input
          ref={customIconifyInputRef}
          value={values.customIconifyIconId}
          onChange={(event) => {
            setErrorMessage(null);
            setHasTouchedIconControls(true);
            setValues((current) => ({ ...current, customIconifyIconId: event.target.value.trim() }));
          }}
          placeholder="mdi:home"
          aria-describedby={customIconifyDescribedBy}
          aria-invalid={customIconifyValidationMessage ? "true" : undefined}
          aria-errormessage={customIconifyErrorId}
          className={customIconifyValidationMessage ? "is-invalid" : undefined}
        />
        <p id="category-custom-iconify-help" className="admin-field__help">
          A valid custom Iconify ID overrides the built-in picker for preview and submit.
        </p>
        {customIconifyValidationMessage ? (
          <p id="category-custom-iconify-feedback" className="admin-field__error" role="alert">
            {customIconifyValidationMessage}
          </p>
        ) : null}
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
            Create new
          </button>
        ) : null}
      </div>
    </form>
  );
}
