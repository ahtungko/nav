import { describe, expect, it } from "vitest";
import { getFaviconUrl } from "../../src/lib/favicon";

describe("getFaviconUrl", () => {
  it("derives a first-party favicon URL from the website origin", () => {
    expect(getFaviconUrl("https://chatgpt.com/path?q=1")).toBe("https://chatgpt.com/favicon.ico");
  });

  it("returns a resilient fallback for malformed URLs instead of throwing", () => {
    expect(() => getFaviconUrl("notaurl")).not.toThrow();
    expect(getFaviconUrl("notaurl")).toMatch(/^data:image\/svg\+xml,/);
  });
});
