# Status

## Current milestone

M0 — Yandex Connector PoC (Issue #1) is implemented as a testable worker boundary.

## Completed in code

- isolated Playwright context and related request context per technical account;
- manual login and encrypted session-state save/restore mechanism;
- safe normalization of discovered organizations, locations, review pages, replies, unread state, and pagination;
- controlled, opt-in reply flow with location verification, fresh list/review tokens, and no blind retry after an unknown outcome;
- auth-loss state transition and mocked tests.

## Blocked / manual validation

- A real approved Yandex account is required to prove `APIRequestContext` requests after manual login, two-location reads without UI navigation, restore behavior, and a single controlled reply.
- The source/lifecycle of request `x-csrf-token` and `X-Yandex-ICookie` remains unproven by discovery; the manual PoC requires fresh operator-provided ephemeral values and must record only redacted evidence.

## Next step

Run the manual experiment in the documented approved environment and update `discovery/YANDEX_DISCOVERY.md` with redacted findings.
