import type { ReactNode } from "react";
import { useThemeDocument } from "../../features/theme/useThemeDocument";
import { Footer } from "./Footer";
import { TopBar } from "./TopBar";

type AppShellProps = {
  children: ReactNode;
  topBarTools?: ReactNode;
};

export function AppShell({ children, topBarTools }: AppShellProps) {
  useThemeDocument("public");

  return (
    <div className="app-shell">
      <div className="app-shell__scene" aria-hidden="true">
        <span className="app-shell__halo app-shell__halo--a" />
        <span className="app-shell__halo app-shell__halo--b" />
        <span className="app-shell__glow app-shell__glow--a" />
        <span className="app-shell__glow app-shell__glow--b" />
      </div>
      <div className="app-shell__frame">
        <TopBar tools={topBarTools} />
        <main className="app-shell__content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
