# Implementation plan

## M0 — Yandex Connector PoC (Issue #1)

1. Establish an isolated `yandex-worker` Playwright runtime per technical account. ✅
2. Use the associated `APIRequestContext` for discovered organization, branch, and review reads. ✅
3. Preserve IDs as distinct values and normalize only safe provider data. ✅
4. Encrypt session state outside git and provide a manual restart experiment. ✅
5. Implement a manually enabled, location-checked reply with reconciliation on unknown result. ✅
6. Cover response mapping, pagination, error/auth handling, session encryption, and retry safety with mocks. ✅
7. Perform the real account/read/write experiment only in an approved local or RU environment. ⏳ External manual validation required.

M1 and later Core, entitlement, billing, workers assignments, and UI work are intentionally outside this issue.
