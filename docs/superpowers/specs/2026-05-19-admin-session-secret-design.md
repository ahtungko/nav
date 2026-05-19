# Admin Session Secret Security Patch Design

**Goal:** Separate the admin login password from the admin session-cookie signing key so a captured cookie cannot be used to offline-guess the admin password.

## Scope

This patch changes only the admin session-signing design. It does not add application-side login throttling because brute-force protection for `/api/auth/login` will be handled by Cloudflare WAF/rate limiting rules outside the app.

## Current Problem

The worker currently uses `ADMIN_PASSWORD` for two different purposes:

1. checking the submitted admin password during login
2. deriving the HMAC key used to sign and verify the `vyxolabs_admin_session` cookie

This creates unnecessary key reuse. If an attacker obtains a session token, they can test password guesses against the cookie signature offline without going through the login endpoint or Cloudflare protections.

## Proposed Design

Introduce a new worker secret named `ADMIN_SESSION_SECRET`.

- `ADMIN_PASSWORD` remains the human-entered admin login password
- `ADMIN_SESSION_SECRET` becomes the only secret used for HMAC signing and verification of admin session tokens

The session token format, TTL, cookie name, and cookie attributes remain unchanged unless required for compatibility with the new secret source.

## Components To Change

### `worker/types.ts`

Extend `Env` to include:

- `ADMIN_SESSION_SECRET?: string`

### `worker/lib/auth.ts`

Update auth helpers so responsibilities are separated:

- `verifyPassword()` continues comparing the submitted password against `env.ADMIN_PASSWORD`
- session-signing key import reads from `env.ADMIN_SESSION_SECRET`
- session-token build/verify functions fail closed when `ADMIN_SESSION_SECRET` is missing

No other auth semantics should change:

- token claims stay `iat`, `exp`, `nonce`
- token version stays `v1`
- cookie name stays `vyxolabs_admin_session`
- cookie attributes stay `Path=/; HttpOnly; SameSite=Strict; Secure`

### `tests/worker/auth.test.ts`

Update tests to reflect the new secret split:

- successful login still sets a verifiable cookie
- token verification succeeds when the correct `ADMIN_SESSION_SECRET` is present
- tampered tokens still fail
- expired tokens still fail
- behavior is covered when the session secret is missing, if the test environment can exercise that branch cleanly

### `vitest.worker.config.ts`

Provide `ADMIN_SESSION_SECRET` in the worker test bindings so tests run with the new required secret.

### `README.md`

Update setup/deployment documentation to require two secrets:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Clarify that:

- `ADMIN_PASSWORD` should be a strong admin password
- `ADMIN_SESSION_SECRET` should be a long random secret used only for signing cookies

## Data Flow After Patch

### Login

1. Client submits password to `/api/auth/login`
2. Worker compares submitted password to `env.ADMIN_PASSWORD`
3. If valid, worker signs session claims using `env.ADMIN_SESSION_SECRET`
4. Worker returns the signed cookie

### Authenticated Admin Request

1. Client sends `vyxolabs_admin_session`
2. Worker verifies the token signature using `env.ADMIN_SESSION_SECRET`
3. If signature and time window are valid, request is authenticated

## Error Handling

The patch should fail closed.

- Missing or invalid `ADMIN_PASSWORD` should continue preventing successful login
- Missing `ADMIN_SESSION_SECRET` should prevent building or validating admin session tokens
- Admin requests with unverifiable tokens should continue returning `401 unauthorized`

For this patch, startup-time configuration validation is not required. Existing request-time behavior is sufficient as long as insecure fallback behavior is not introduced.

## Testing Strategy

Use focused worker auth tests to prove the secret split:

1. build a token with fixed claims and verify it using `ADMIN_SESSION_SECRET`
2. prove tampering still invalidates the token
3. prove expiry handling is unchanged
4. verify successful login still emits a cookie that validates under the session secret
5. verify invalid password handling is unchanged

Run:

- targeted worker auth tests
- full project test suite before completion

## Non-Goals

This design does not:

- add CSRF protection changes
- add app-side login throttling or lockout
- change session TTL
- rotate existing cookie format or introduce server-side session storage
- add Cloudflare Access or WAF configuration in code

## Acceptance Criteria

The patch is complete when all of the following are true:

1. `ADMIN_PASSWORD` is used only for login-password verification
2. `ADMIN_SESSION_SECRET` is used only for session-cookie signing and verification
3. no code path signs session cookies with `ADMIN_PASSWORD`
4. worker auth tests pass with the new secret split
5. README documents the new secret requirement clearly
