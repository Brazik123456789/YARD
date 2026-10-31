# M0 Yandex Connector PoC — implementation results

Issue: #1

## Implemented hypothesis test

`yandex-worker` creates one isolated Playwright `BrowserContext` per technical account and uses its `context.request` as the sole provider HTTP client. The read commands use only the discovery-observed routes:

- `GET /sprav/api/companies?filter=`;
- `GET /sprav/api/chain/{tycoonId}/branches`;
- `GET /sprav/api/{locationPermanentId}/reviews`.

The manual procedure reads two location IDs sequentially through that request context without UI navigation. It is intentionally not asserted as complete until it is run with an approved account.

## Confirmed by automated tests

- provider IDs are kept distinct rather than treated as interchangeable;
- review pages preserve pagination, reply moderation state, and unread state without emitting CSRF values;
- 401/403 transitions to `AUTH_REQUIRED`;
- unknown reply outcomes perform one reconciliation read and no blind repeat POST;
- persisted browser state is encrypted at rest and restores correctly in a mocked local round trip.

## Request-state bootstrap status

The implementation includes a headed `request-state-diagnostic` command. It observes only the presence or absence of Yandex Business API traffic, `x-csrf-token`, `X-Yandex-ICookie`, and their joint presence. It never prints, stores, or persists values, cookies, request URLs, or provider identifiers.

This is diagnostic readiness, not proof that a first controlled write can obtain request state. The discovery evidence does not establish that ordinary page-load or GET traffic carries both headers. Until an approved local/RU-browser experiment reports both headers from normal authenticated Yandex Business activity, `reply` remains disabled and M0 must not claim write-state bootstrap readiness. If the experiment observes both headers, document the request method and endpoint family with IDs redacted. If it does not, record that absence as the blocker and do not introduce a guessed token source.

## Requires the manual experiment

- actual authorization after manual login;
- read access to organizations, branches, and two locations through `APIRequestContext`;
- session restoration against Yandex after a distinct new runtime/process starts from encrypted state;
- whether ordinary authenticated Yandex Business page activity exposes both required request headers before the first write;
- one separately approved real reply and the provider's subsequent moderation state.

The manual `m0-read` command proves the explicit sequence organizations → approved chain → discovered branches → reviews for two branches, including a second page, without UI switching. `restore-check` is run as a new process after login to test the encrypted-state restore path. `request-state-diagnostic` must run before any controlled reply and emits only redacted presence/absence evidence. A real reply requires both manual-test approval environment variables and `--approved-real-write true`; it refreshes request state from the authenticated browser, targets an explicit review page, and rereads that page after submission. If the browser does not expose fresh request state, the write remains disabled. No real Yandex request is issued by the automated test suite. Session files, request headers, cookies, token values, review text, and account data are excluded from source control and normal CLI output.
