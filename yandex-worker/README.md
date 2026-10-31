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

Complete login, CAPTCHA, and 2FA manually in the headed browser. Stop the command after login; the encrypted state is saved. Then run the read-only M0 experiment without navigating the UI to each location. It proves organizations → the approved chain → discovered branches → reviews for two branches, including pagination:

```bash
npm start -- m0-read --chain-id '<tycoon-id>' --chain-permalink '<permanent-chain-id>'
```

Start a distinct process to test restoration from the encrypted state:

```bash
npm start -- restore-check
```

A `401`, `403`, or unexpected non-JSON response transitions the account to `AUTH_REQUIRED`; do not retry write operations.

## Controlled reply

The reply command is deliberately blocked unless both approval environment variables and `--approved-real-write true` are supplied. It refreshes an authenticated Yandex Business page and captures the observed `x-csrf-token` and `X-Yandex-ICookie` only in memory from its BrowserContext. It then rereads the explicitly requested review page, verifies the review belongs to the requested location, obtains `list.csrf_token` and `business_answer_csrf_token` fresh from that response, submits once, and rereads that same page before reporting the outcome. On a timeout/unknown outcome it rereads first and never blindly retries.

If the authenticated page does not expose both request headers, the command stays disabled. Do not pass those headers through environment variables, command arguments, files, or logs. This is an evidence gap to record in redacted form, not a reason to bypass the browser or automate CAPTCHA/2FA.

```bash
export YANDEX_MANUAL_TESTS=true
export YANDEX_CONTROLLED_WRITE_APPROVED=true
npm start -- reply --approved-real-write true --location-id '<location>' --review-id '<review>' --page '<approved page>' --text '<approved reply>'
```

Do not run this command without an explicitly approved real review and reply. A `200 OK` is not treated as a published response: the subsequent read checks `owner_comment` and its moderation status.

## Tests

```bash
npm test
```

The manual suite is excluded from normal tests and does not call Yandex automatically. The read-only experiment requires `YANDEX_MANUAL_TESTS=true`, `YANDEX_MANUAL_CHAIN_ID`, and `YANDEX_MANUAL_CHAIN_PERMALINK`. The controlled reply test is additionally skipped until `YANDEX_CONTROLLED_WRITE_APPROVED=true` and all target values are supplied. CI runs only `npm ci` and `npm test`.
