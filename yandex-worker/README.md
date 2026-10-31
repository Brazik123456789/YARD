# Yandex Connector M0 PoC

This worker is an isolated, manual Yandex Business experiment. It uses one Playwright `BrowserContext` and its related `browserContext.request` API request context per technical account. It does not contain Yard billing, tenant data, polling, AI, or any automatic write.

## Prerequisites

- Node 20+ and `npm install` from the repository root;
- Playwright Chromium: `npx playwright install chromium`;
- an approved Yandex technical account and a local/approved RU environment for the real experiment;
- a non-empty `YANDEX_SESSION_STATE_ENCRYPTION_KEY`. The session file is AES-256-GCM encrypted and saved outside git under `YANDEX_SESSION_STATE_DIR` (default `runtime/yandex-sessions`).

Never copy a browser state, cookie, request CSRF value, or Yandex ICookie into the repository, command history, test fixture, or logs.

## Manual flow

Run from the repository root:

```bash
export YANDEX_SESSION_STATE_ENCRYPTION_KEY='<local secret>'
export YANDEX_SESSION_STATE_DIR="$PWD/runtime/yandex-sessions"
npm start -- login --account yandex-agent-01
```

Complete login, CAPTCHA, and 2FA manually in the headed browser. Stop the command after login; the encrypted state is saved. Then run the read-only experiment without navigating the UI to each location:

```bash
npm start -- check
npm start -- organizations
npm start -- locations --chain-id '<tycoon-id>' --chain-permalink '<permanent-chain-id>'
npm start -- reviews --location-id '<location-A>' --page 1
npm start -- reviews --location-id '<location-A>' --page 2
npm start -- reviews --location-id '<location-B>' --page 1
```

Restart the process and repeat `check` and the two reviews commands to test state restoration. A `401`, `403`, or unexpected non-JSON response transitions the account to `AUTH_REQUIRED`; do not retry write operations.

## Controlled reply

The reply command is deliberately blocked unless `--allow-write true` is supplied. It rereads the first reviews page, verifies the review belongs to the requested location, obtains `list.csrf_token` and `business_answer_csrf_token` fresh from that response, submits once, and rereads before reporting the outcome. On a timeout/unknown outcome it rereads first and never blindly retries.

`x-csrf-token` and `X-Yandex-ICookie` were observed as request headers, but their derivation through `APIRequestContext` is not yet proven by discovery. An explicitly approved operator must provide their fresh ephemeral values through local environment secrets for the manual write experiment; they are neither persisted nor printed.

```bash
export YANDEX_REQUEST_CSRF_TOKEN='<ephemeral secret>'
export YANDEX_I_COOKIE='<ephemeral secret>'
npm start -- reply --allow-write true --location-id '<location>' --review-id '<review>' --text '<approved reply>'
```

Do not run this command without an explicitly approved real review and reply. A `200 OK` is not treated as a published response: the subsequent read checks `owner_comment` and its moderation status.

## Tests

```bash
npm test
```

The manual suite is excluded from normal tests and does not call Yandex automatically. After completing the headed login and supplying two approved location IDs, the read-only two-location experiment is selectable through `YANDEX_MANUAL_TESTS=true YANDEX_MANUAL_LOCATION_A='<id>' YANDEX_MANUAL_LOCATION_B='<id>' npm run test:manual`. It never submits a reply.
