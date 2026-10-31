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

## Requires the manual experiment

- actual authorization after manual login;
- read access to organizations, branches, and two locations through `APIRequestContext`;
- session restoration against Yandex after a distinct new runtime/process starts from encrypted state;
- whether a live authenticated Yandex Business request consistently exposes the request `x-csrf-token` / `X-Yandex-ICookie` values captured only in memory;
- one separately approved real reply and the provider's subsequent moderation state.

The manual `m0-read` command proves the explicit sequence organizations → approved chain → discovered branches → reviews for two branches, including a second page, without UI switching. `restore-check` is run as a new process after login to test the encrypted-state restore path. A real reply requires both manual-test approval environment variables and `--approved-real-write true`; it refreshes request state from the authenticated browser, targets an explicit review page, and rereads that page after submission. If the browser does not expose fresh request state, the write remains disabled. No real Yandex request is issued by the automated test suite. Session files, request headers, cookies, token values, review text, and account data are excluded from source control and normal CLI output.
