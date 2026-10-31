# Status

## Current milestone

M0 — Yandex Connector PoC (Issue #1) is implemented as a testable worker boundary.

## Completed in code

- isolated Playwright context and related request context per technical account;
- manual login and encrypted session-state save/restore mechanism;
- safe normalization of discovered organizations, locations, review pages, replies, unread state, and pagination;
- controlled, opt-in reply flow with location verification, an explicit review page, fresh list/review tokens, and no blind retry after an unknown outcome;
- redacted headed diagnostic and in-memory capture of request CSRF/ICookie only from the authenticated BrowserContext; no manual header injection or persistence;
- auth-loss state transition and mocked tests.
- GitHub Actions CI for `npm ci` and the automated unit suite.

## Blocked / manual validation

- A real approved Yandex account is required to prove `APIRequestContext` requests after manual login, two-location reads without UI navigation, restore behavior, and a single controlled reply.
- The source/lifecycle of request `x-csrf-token` and `X-Yandex-ICookie` remains unproven by discovery. The headed diagnostic must first establish whether normal authenticated page activity exposes both headers; until then the controlled write remains disabled and M0 cannot claim write readiness.

## Next step

Run the manual experiment in the documented approved environment and update `discovery/YANDEX_DISCOVERY.md` with redacted findings.
