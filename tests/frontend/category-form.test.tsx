import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryForm } from "../../src/components/admin/CategoryForm";

describe("CategoryForm", () => {
  it("submits the selected icon key from the category icon picker", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} />);

    expect(screen.queryByLabelText(/icon key/i)).not.toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /category icon/i })).toBeInTheDocument();

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
});
