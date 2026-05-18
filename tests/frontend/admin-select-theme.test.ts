import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminCss = readFileSync(resolve("src/styles/admin.css"), "utf8");

describe("admin select styling", () => {
  it("defines explicit night-mode dropdown option colors for readability", () => {
    expect(adminCss).toContain(':root[data-theme="night"] .admin-field select option');
    expect(adminCss).toContain("background-color: #12162a;");
    expect(adminCss).toContain("color: #f5f3ff;");
  });
});
