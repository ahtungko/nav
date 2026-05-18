import type { CSSProperties, ReactNode } from "react";
import { useThemeDocument } from "../../features/theme/useThemeDocument";
import { Footer } from "./Footer";
import { TopBar } from "./TopBar";

type AppShellProps = {
  children: ReactNode;
  topBarTools?: ReactNode;
};

const petals = Array.from({ length: 26 }, (_, index) => ({
  left: `${((index * 3.87) % 100).toFixed(2)}vw`,
  width: `${(10 + (index % 7) * 1.6).toFixed(2)}px`,
  height: `${((10 + (index % 7) * 1.6) * 0.72).toFixed(2)}px`,
  drift: `${(-90 + (index % 9) * 22).toFixed(2)}px`,
  scale: (0.55 + (index % 6) * 0.11).toFixed(2),
  duration: `${(10 + (index % 8) * 1.1).toFixed(2)}s`,
  delay: `${(-18 + index * 0.65).toFixed(2)}s`,
  opacity: (0.35 + (index % 5) * 0.09).toFixed(2),
}));

export function AppShell({ children, topBarTools }: AppShellProps) {
  useThemeDocument("public");

  return (
    <div className="app-shell">
      <div className="app-shell__scene" aria-hidden="true">
        <span className="app-shell__halo app-shell__halo--a" />
        <span className="app-shell__halo app-shell__halo--b" />
        <span className="app-shell__mist" />
        <span className="app-shell__horizon" />
        <span className="app-shell__water" />
        <span className="app-shell__reflection" />
        <span className="app-shell__floating-light app-shell__floating-light--a" />
        <span className="app-shell__floating-light app-shell__floating-light--b" />
        <span className="app-shell__floating-light app-shell__floating-light--c" />
        <span className="app-shell__floating-light app-shell__floating-light--d" />
      </div>

      <div className="petals-layer" aria-hidden="true">
        {petals.map((petal, index) => (
          <span
            key={index}
            className="petal"
            style={
              {
                left: petal.left,
                width: petal.width,
                height: petal.height,
                animationDuration: petal.duration,
                animationDelay: petal.delay,
                opacity: petal.opacity,
                "--drift": petal.drift,
                "--scale": petal.scale,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="app-shell__frame">
        <TopBar tools={topBarTools} />
        <main className="app-shell__content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
