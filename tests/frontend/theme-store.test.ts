import { describe, expect, it } from "vitest";
import { applyTheme } from "../../src/features/theme/apply-theme";
import { resolveTheme } from "../../src/features/theme/theme-store";
import { THEME_ATTRIBUTE } from "../../src/lib/constants";

describe("resolveTheme", () => {
  it("uses day when preference is day", () => {
    expect(resolveTheme("day", true)).toBe("day");
  });

  it("uses night when preference is night", () => {
    expect(resolveTheme("night", false)).toBe("night");
  });

  it("uses system dark when preference is auto", () => {
    expect(resolveTheme("auto", true)).toBe("night");
  });

  it("uses system light when preference is auto and dark mode is off", () => {
    expect(resolveTheme("auto", false)).toBe("day");
  });
});

describe("applyTheme", () => {
  it("sets the root theme attribute to the resolved theme", () => {
    const root = document.createElement("div");

    const resolved = applyTheme("auto", true, root);

    expect(resolved).toBe("night");
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe("night");
  });
});
