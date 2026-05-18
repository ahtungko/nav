import type { ReactNode } from "react";
import { useThemeDocument } from "../../features/theme/useThemeDocument";
import { ThemeToggle } from "../public/ThemeToggle";

type AdminShellProps = {
  children: ReactNode;
  centered?: boolean;
};

export function AdminShell({ children, centered = false }: AdminShellProps) {
  useThemeDocument("admin");

  return (
    <div className="admin-app">
      <div className="admin-app__scene" aria-hidden="true">
        <span className="admin-app__halo admin-app__halo--a" />
        <span className="admin-app__halo admin-app__halo--b" />
        <span className="admin-app__glow admin-app__glow--a" />
        <span className="admin-app__glow admin-app__glow--b" />
      </div>

      <div className={`admin-app__frame${centered ? " is-centered" : ""}`}>
        <header className="admin-topbar">
          <a className="brand-mark" href="/" aria-label="Go to homepage">
            <span className="brand-mark__icon" aria-hidden="true">
              ✿
            </span>
            <span className="brand-mark__text">vyxolabs</span>
          </a>

          <div className="admin-topbar__tools">
            <ThemeToggle />
          </div>
        </header>

        <main className="admin-app__content">{children}</main>
      </div>
    </div>
  );
}
