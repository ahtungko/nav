import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HomePage } from "../../src/app/public/HomePage";

const snapshot = {
  version: 1 as const,
  publishedAt: "2026-05-18T00:00:00.000Z",
  categories: [
    { id: "c1", name: "AI", slug: "ai", iconKey: "ai", sortOrder: 1 },
    { id: "c2", name: "Design", slug: "design", iconKey: "design", sortOrder: 2 },
  ],
  websites: [
    {
      id: "w1",
      title: "ChatGPT",
      url: "https://chatgpt.com",
      categoryId: "c1",
      sortOrder: 1,
      createdAt: "2026-05-18T00:00:00.000Z",
    },
    {
      id: "w2",
      title: "Claude",
      url: "notaurl",
      categoryId: "c1",
      sortOrder: 2,
      createdAt: "2026-05-17T00:00:00.000Z",
    },
    {
      id: "w3",
      title: "Figma",
      url: "https://figma.com",
      categoryId: "c2",
      sortOrder: 1,
      createdAt: "2026-05-19T00:00:00.000Z",
    },
  ],
};

describe("HomePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the main public panels", () => {
    render(<HomePage snapshot={snapshot} />);

    expect(screen.getByText("Popular Categories")).toBeInTheDocument();
    expect(screen.getByText("Pinned")).toBeInTheDocument();
    expect(screen.getByText("Recently Added")).toBeInTheDocument();
  });

  it("filters recent websites with the local search input", () => {
    render(<HomePage snapshot={snapshot} />);

    fireEvent.change(screen.getAllByRole("searchbox", { name: "Quick search" })[0]!, {
      target: { value: "fig" },
    });

    expect(screen.getByRole("link", { name: "Figma" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ChatGPT" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Claude" })).not.toBeInTheDocument();
  });

  it("pins a website from the recent panel into the pinned panel", () => {
    render(<HomePage snapshot={snapshot} />);

    const recentSection = screen.getByText("Recently Added").closest(".section-block") as HTMLElement | null;
    expect(recentSection).not.toBeNull();

    fireEvent.click(within(recentSection!).getAllByRole("button", { name: "Pin ChatGPT" })[0]!);

    const pinnedSection = screen.getAllByText("Pinned")[0]!.closest(".section-block") as HTMLElement | null;
    expect(pinnedSection).not.toBeNull();
    expect(within(pinnedSection!).getByRole("link", { name: "ChatGPT" })).toBeInTheDocument();
    expect(within(pinnedSection!).queryByText("No pinned websites yet")).not.toBeInTheDocument();
  });

  it("filters panels by the selected category and allows toggling the filter off", () => {
    render(<HomePage snapshot={snapshot} />);

    fireEvent.click(screen.getAllByRole("button", { name: /Design/i })[0]!);
    expect(screen.getByRole("link", { name: "Figma" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ChatGPT" })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Design/i })[0]!);
    expect(screen.getByRole("link", { name: "ChatGPT" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Figma" })).toBeInTheDocument();
  });

  it("does not crash when a published website URL is malformed", () => {
    render(<HomePage snapshot={snapshot} />);

    expect(screen.getAllByRole("link", { name: "Claude" }).length).toBeGreaterThan(0);
  });
});
