import { describe, expect, it } from "vitest";
import { getFaviconUrl, getWebsiteFaviconUrl } from "../../src/lib/favicon";

describe("getFaviconUrl", () => {
  it("derives a first-party favicon URL from the website origin", () => {
    expect(getFaviconUrl("https://chatgpt.com/path?q=1")).toBe("https://chatgpt.com/favicon.ico");
  });

  it("returns a resilient fallback for malformed URLs instead of throwing", () => {
    expect(() => getFaviconUrl("notaurl")).not.toThrow();
    expect(getFaviconUrl("notaurl")).toMatch(/^data:image\/svg\+xml,/);
  });
});

describe("getWebsiteFaviconUrl", () => {
  it("prefers a custom favicon URL when provided", () => {
    expect(
      getWebsiteFaviconUrl({
        url: "https://gemini.google.com",
        faviconUrl: "https://static.example.com/gemini.png",
      }),
    ).toBe("https://static.example.com/gemini.png");
  });

  it("falls back to the website favicon when no override is present", () => {
    expect(
      getWebsiteFaviconUrl({
        url: "https://chatgpt.com/path?q=1",
        faviconUrl: undefined,
      }),
    ).toBe("https://chatgpt.com/favicon.ico");
  });

  it("falls back to the website favicon when faviconUrl is blank or whitespace", () => {
    expect(
      getWebsiteFaviconUrl({
        url: "https://chatgpt.com/path?q=1",
        faviconUrl: "",
      }),
    ).toBe("https://chatgpt.com/favicon.ico");

    expect(
      getWebsiteFaviconUrl({
        url: "https://chatgpt.com/path?q=1",
        faviconUrl: "   ",
      }),
    ).toBe("https://chatgpt.com/favicon.ico");
  });
});
