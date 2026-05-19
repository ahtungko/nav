import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@iconify/react", () => ({
  Icon: ({ icon, className, "aria-hidden": ariaHidden }: { icon: string; className?: string; "aria-hidden"?: boolean }) => (
    <span data-testid="iconify-icon" data-icon={icon} data-class={className} data-aria-hidden={String(ariaHidden)} />
  ),
}));

import { CategoryForm } from "../../src/components/admin/CategoryForm";

describe("CategoryForm", () => {
  it("submits the selected built-in icon key when the custom iconify field is blank", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} />);

    expect(screen.getByRole("radiogroup", { name: /category icon/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/custom iconify id/i)).toHaveValue("");

    fireEvent.click(screen.getByRole("radio", { name: /design/i }));
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Design" } });
    fireEvent.change(screen.getByLabelText(/^slug$/i), { target: { value: "design" } });
    fireEvent.change(screen.getByLabelText(/sort order/i), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /save category/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          iconKey: "design",
        }),
      );
    });
  });

  it("submits a valid custom iconify id instead of the selected built-in icon", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("radio", { name: /design/i }));
    fireEvent.change(screen.getByLabelText(/custom iconify id/i), { target: { value: "mdi:home" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Design" } });
    fireEvent.change(screen.getByLabelText(/^slug$/i), { target: { value: "design" } });
    fireEvent.change(screen.getByLabelText(/sort order/i), { target: { value: "2" } });

    expect(screen.getByTestId("iconify-icon")).toHaveAttribute("data-icon", "mdi:home");
    expect(screen.getByText(/effective icon key: mdi:home/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save category/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          iconKey: "mdi:home",
        }),
      );
    });
  });

  it("prefills a saved custom iconify id and previews that custom icon while editing", () => {
    render(
      <CategoryForm
        onSubmit={vi.fn()}
        initialValues={{
          name: "AI Tools",
          slug: "ai-tools",
          iconKey: "mdi:star",
          sortOrder: 1,
          isVisible: true,
        }}
      />,
    );

    expect(screen.getByLabelText(/custom iconify id/i)).toHaveValue("mdi:star");
    expect(screen.getByRole("radio", { name: /^ai$/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("iconify-icon")).toHaveAttribute("data-icon", "mdi:star");
    expect(screen.getByText(/preview source: custom iconify id/i)).toBeInTheDocument();
    expect(screen.getByText(/effective icon key: mdi:star/i)).toBeInTheDocument();
  });

  it("preserves an untouched saved legacy icon key through submit and labels the preview source accordingly", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CategoryForm
        onSubmit={onSubmit}
        initialValues={{
          name: "AI Tools",
          slug: "ai-tools",
          iconKey: "sparkles",
          sortOrder: 1,
          isVisible: true,
        }}
      />,
    );

    expect(screen.getByText(/preview source: existing saved legacy icon/i)).toBeInTheDocument();
    expect(screen.getByText(/effective icon key: sparkles/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/custom iconify id/i)).toHaveValue("");
    expect(screen.getByRole("radio", { name: /^ai$/i })).toHaveAttribute("aria-checked", "true");

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "AI Tools Updated" } });
    fireEvent.click(screen.getByRole("button", { name: /save category/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          iconKey: "sparkles",
          name: "AI Tools Updated",
        }),
      );
    });
  });

  it("blocks submit for a malformed custom iconify id, marks the field invalid, and focuses it", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} />);

    const customIconifyInput = screen.getByLabelText(/custom iconify id/i);

    fireEvent.click(screen.getByRole("radio", { name: /design/i }));
    fireEvent.change(customIconifyInput, { target: { value: "mdi bad icon" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Design" } });
    fireEvent.change(screen.getByLabelText(/^slug$/i), { target: { value: "design" } });
    fireEvent.change(screen.getByLabelText(/sort order/i), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /save category/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(customIconifyInput).toHaveFocus();
    expect(customIconifyInput).toHaveAttribute("aria-invalid", "true");
    expect(customIconifyInput).toHaveAttribute("aria-errormessage", "category-custom-iconify-feedback");
    expect(customIconifyInput).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("category-custom-iconify-help"),
    );
    expect(customIconifyInput).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("category-custom-iconify-feedback"),
    );
    expect(screen.getByText(/enter a valid iconify id/i)).toBeInTheDocument();
    expect(screen.queryByTestId("iconify-icon")).not.toBeInTheDocument();
    expect(screen.getByText(/effective icon key: design/i)).toBeInTheDocument();
  });

  it("preserves keyboard navigation in the built-in picker and existing slug behavior", () => {
    render(<CategoryForm onSubmit={vi.fn()} />);

    const nameInput = screen.getByLabelText(/^name$/i);
    const slugInput = screen.getByLabelText(/^slug$/i);
    const aiOption = screen.getByRole("radio", { name: /^ai$/i });
    const websiteOption = screen.getByRole("radio", { name: /^website$/i });

    expect(aiOption).toHaveAttribute("tabindex", "0");
    expect(websiteOption).toHaveAttribute("tabindex", "-1");

    aiOption.focus();
    fireEvent.keyDown(aiOption, { key: "ArrowRight" });

    expect(websiteOption).toHaveAttribute("aria-checked", "true");
    expect(websiteOption).toHaveFocus();
    expect(websiteOption).toHaveAttribute("tabindex", "0");
    expect(aiOption).toHaveAttribute("tabindex", "-1");

    fireEvent.change(nameInput, { target: { value: "AI Tools" } });
    expect(slugInput).toHaveValue("ai-tools");

    fireEvent.change(slugInput, { target: { value: "custom-slug" } });
    fireEvent.change(nameInput, { target: { value: "AI Tools Updated" } });

    expect(slugInput).toHaveValue("custom-slug");
  });

  it("preserves an existing saved non-empty slug while editing", () => {
    render(
      <CategoryForm
        onSubmit={vi.fn()}
        initialValues={{
          name: "AI Tools",
          slug: "ai-directory",
          iconKey: "ai",
          sortOrder: 1,
          isVisible: true,
        }}
      />,
    );

    const nameInput = screen.getByLabelText(/^name$/i);
    const slugInput = screen.getByLabelText(/^slug$/i);

    fireEvent.change(nameInput, { target: { value: "AI Tools Updated" } });

    expect(slugInput).toHaveValue("ai-directory");
  });

  it("keeps auto-slug mode when editing a category whose saved slug is blank", () => {
    render(
      <CategoryForm
        onSubmit={vi.fn()}
        initialValues={{
          name: "AI Tools",
          slug: "",
          iconKey: "ai",
          sortOrder: 1,
          isVisible: true,
        }}
      />,
    );

    const nameInput = screen.getByLabelText(/^name$/i);
    const slugInput = screen.getByLabelText(/^slug$/i);

    fireEvent.change(nameInput, { target: { value: "AI Tools Updated" } });

    expect(slugInput).toHaveValue("ai-tools-updated");
  });
});
