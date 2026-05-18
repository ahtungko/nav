import { describe, expect, it } from "vitest";
import { searchWebsites } from "../../src/features/search/search-websites";

describe("searchWebsites", () => {
  it("matches title and url", () => {
    const items = [
      { id: "1", title: "ChatGPT", url: "https://chatgpt.com" },
      { id: "2", title: "Framer", url: "https://framer.com" },
    ];
    expect(searchWebsites(items, "chat").map((item) => item.id)).toEqual(["1"]);
    expect(searchWebsites(items, "fram").map((item) => item.id)).toEqual(["2"]);
  });
});
