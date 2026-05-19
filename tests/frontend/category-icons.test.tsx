import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@iconify/react", () => ({
  Icon: ({ icon, className, "aria-hidden": ariaHidden }: { icon: string; className?: string; "aria-hidden"?: boolean }) => (
    <span data-testid="iconify-icon" data-icon={icon} data-class={className} data-aria-hidden={String(ariaHidden)} />
  ),
}));

import {
  DEFAULT_CATEGORY_ICON_KEY,
  isBuiltInCategoryIconKey,
  isValidCategoryIconValue,
  isValidIconifyIconId,
  resolveCategoryIconKey,
  splitCategoryIconValue,
} from "../../src/lib/category-icon-registry";
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryIconClassName,
  getCategoryIconDisplayLabel,
  getCategoryIconOption,
  renderCategoryIcon,
} from "../../src/lib/category-icons";

describe("category icon registry", () => {
  it("validates built-in category icon keys", () => {
    expect(isBuiltInCategoryIconKey("ai")).toBe(true);
    expect(isBuiltInCategoryIconKey("entertainment")).toBe(true);
    expect(isBuiltInCategoryIconKey("mdi:home")).toBe(false);
    expect(isBuiltInCategoryIconKey("unknown")).toBe(false);
  });

  it("validates iconify icon ids", () => {
    expect(isValidIconifyIconId("mdi:home")).toBe(true);
    expect(isValidIconifyIconId("tabler:brand-openai")).toBe(true);
    expect(isValidIconifyIconId("@custom-provider:mdi-light:home")).toBe(true);
    expect(isValidIconifyIconId("ai")).toBe(false);
    expect(isValidIconifyIconId("mdi")).toBe(false);
    expect(isValidIconifyIconId("mdi:")).toBe(false);
    expect(isValidIconifyIconId("mdi:home_icon")).toBe(false);
    expect(isValidIconifyIconId("mdi:home.icon")).toBe(false);
    expect(isValidIconifyIconId("mdi:home with spaces")).toBe(false);
  });

  it("splits saved values into built-in and custom state", () => {
    expect(splitCategoryIconValue("design")).toEqual({
      builtInIconKey: "design",
      customIconifyIconId: "",
    });

    expect(splitCategoryIconValue("mdi:home")).toEqual({
      builtInIconKey: DEFAULT_CATEGORY_ICON_KEY,
      customIconifyIconId: "mdi:home",
    });
  });

  it("prefers a valid custom iconify id over the built-in selection", () => {
    expect(resolveCategoryIconKey("design", "mdi:home")).toBe("mdi:home");
    expect(resolveCategoryIconKey("design", "not valid")).toBe("design");
    expect(resolveCategoryIconKey("unknown", "")).toBe(DEFAULT_CATEGORY_ICON_KEY);
  });

  it("treats malformed values as invalid and falls back cleanly", () => {
    expect(isValidCategoryIconValue("mdi:bad icon")).toBe(false);
    expect(isValidCategoryIconValue("unknown")).toBe(false);

    expect(splitCategoryIconValue("mdi:bad icon")).toEqual({
      builtInIconKey: DEFAULT_CATEGORY_ICON_KEY,
      customIconifyIconId: "",
    });
  });
});

describe("category icon renderer", () => {
  it("exports the shared category icon options", () => {
    expect(CATEGORY_ICON_OPTIONS.find((option) => option.key === "ai")?.label).toBe("AI");
    expect(getCategoryIconOption("website").key).toBe("website");
  });

  it("renders custom iconify ids with the iconify react component", () => {
    render(<div>{renderCategoryIcon("mdi:home")}</div>);

    expect(screen.getByTestId("iconify-icon")).toHaveAttribute("data-icon", "mdi:home");
    expect(getCategoryIconClassName("mdi:home")).toBe("category-card__icon--custom");
    expect(getCategoryIconDisplayLabel("mdi:home")).toBe("mdi:home");
  });

  it("falls back to the default built-in icon for malformed values", () => {
    render(<div>{renderCategoryIcon("mdi:bad icon")}</div>);

    expect(screen.queryByTestId("iconify-icon")).not.toBeInTheDocument();
    expect(getCategoryIconOption("mdi:bad icon").key).toBe(DEFAULT_CATEGORY_ICON_KEY);
    expect(getCategoryIconClassName("mdi:bad icon")).toBe(`category-card__icon--${DEFAULT_CATEGORY_ICON_KEY}`);
    expect(getCategoryIconDisplayLabel("mdi:bad icon")).toBe(getCategoryIconOption(DEFAULT_CATEGORY_ICON_KEY).label);
  });
});
