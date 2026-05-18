export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__socials" aria-label="Social links">
        <a href="https://github.com/vyxolabs/nav" aria-label="GitHub" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3C7 3 3 7 3 12c0 4 2.6 7.4 6.3 8.6c.5.1.7-.2.7-.5v-2c-2.5.5-3-.6-3.2-1.2c-.1-.3-.6-1.2-1-1.4c-.4-.2-.9-.7 0-.7c.8 0 1.4.8 1.6 1.1c.9 1.5 2.3 1.1 2.9.8c.1-.6.4-1.1.7-1.4c-2.2-.3-4.6-1.1-4.6-4.9c0-1.1.4-2 1.1-2.8c-.1-.3-.5-1.4.1-2.8c0 0 .9-.3 2.9 1.1a10 10 0 0 1 5.2 0c2-1.4 2.9-1.1 2.9-1.1c.6 1.4.2 2.5.1 2.8c.7.8 1.1 1.7 1.1 2.8c0 3.8-2.3 4.6-4.6 4.9c.4.3.7 1 .7 2v3c0 .3.2.6.7.5C18.4 19.4 21 16 21 12c0-5-4-9-9-9Z" />
          </svg>
        </a>
        <a href="mailto:admin@vyxolabs.com" aria-label="Email">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16v12H4z" />
            <path d="m5 7l7 6l7-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
      <p>© 2026 vyxolabs.com. All rights reserved.</p>
    </footer>
  );
}
