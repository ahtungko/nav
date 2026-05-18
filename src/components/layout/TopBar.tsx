import type { ReactNode } from "react";

type TopBarProps = {
  tools?: ReactNode;
};

export function TopBar({ tools }: TopBarProps) {
  return (
    <header className="top-bar">
      <a className="brand-mark" href="/" aria-label="Go to homepage">
        <span className="brand-mark__icon" aria-hidden="true">
          ✿
        </span>
        <span className="brand-mark__text">vyxolabs</span>
      </a>

      {tools ? <div className="top-bar__tools">{tools}</div> : null}
    </header>
  );
}
