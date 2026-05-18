import { type FormEvent, useState } from "react";

type LoginPageProps = {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onLogin?: (password: string) => Promise<void> | void;
};

export function LoginPage({ errorMessage, isSubmitting = false, onLogin }: LoginPageProps = {}) {
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin?.(password);
  }

  return (
    <main className="admin-auth-shell">
      <section className="admin-auth-card" aria-labelledby="admin-login-title">
        <p className="admin-auth-card__eyebrow">vyxolabs Admin</p>
        <h1 id="admin-login-title">Admin login</h1>
        <p>Enter the admin password to manage draft categories, websites, and publish snapshots.</p>

        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label className="admin-field" htmlFor="admin-password">
            <span>Password</span>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? <p className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}

          <button type="submit" className="admin-button admin-button--primary admin-auth-form__submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

