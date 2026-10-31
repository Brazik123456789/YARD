# AGENTS.md — Yard

**Статус:** обязательные правила для Codex и любых coding agents  
**Проект:** Yard  
**Версия:** 0.1  
**Дата:** 31 октября 2026

---

# 1. Назначение

Этот файл содержит обязательные инженерные правила проекта Yard.

Перед любой задачей агент обязан прочитать:

1. `AGENTS.md`;
2. актуальный `YARD_TZ_v0.3.md`;
3. `docs/ARCHITECTURE.md`, если существует;
4. `docs/DECISIONS.md`, если существует;
5. `docs/STATUS.md`, если существует;
6. relevant discovery documents.
7. `docs/CODEX_HANDOFF_PROTOCOL.md`.

Не полагаться только на историю Codex task или чат.

---

# 2. Scope MVP

Первый MVP Yard — **работа с отзывами**.

Поддерживаемые платформы:

- Яндекс.Бизнес / Яндекс.Карты;
- Google Business Profile / Google Maps;
- 2ГИС.

Не расширять MVP без явного решения Product Owner.

Не добавлять самостоятельно:

- публикации;
- новости;
- сторис;
- фотографии;
- SEO-аудит;
- аналитику конкурентов;
- контроль качества;
- AI-обзвоны;
- управление карточками;
- другие будущие функции.

---

# 3. Tech stack

Основной backend:

- Java 21;
- Spring Boot 3;
- Maven;
- PostgreSQL.

Frontend:

- React;
- Vite.

Browser/provider integration:

- Playwright.

Допускаются Redis/RabbitMQ, Docker и observability tools при обоснованной необходимости.

Не менять базовый стек без ADR и явного согласования.

---

# 4. Architecture style

Yard Core — модульный монолит.

Не создавать микросервисы ради микросервисов.

Отдельные provider workers разрешены, если provider требует отдельного browser/session runtime.

Предпочтительная граница:

```text
yard-backend
yard-web
yard-yandex-worker
yard-2gis-worker
```

Google может оставаться обычным connector module, если официальный API это позволяет.

---

# 5. Core vs Worker

Главное архитектурное правило:

> Core определяет WHO / WHAT MAY BE DONE.  
> Worker определяет HOW / WHEN TECHNICALLY TO DO IT.

## Core owns:

- Customer;
- Workspace;
- Location;
- Subscription;
- Entitlement;
- Review;
- AI policy;
- approval;
- billing state;
- notifications;
- audit;
- business commands.

## Worker owns:

- provider authentication/session;
- polling;
- pagination;
- CSRF;
- provider HTTP endpoints;
- browser state;
- retries;
- provider-specific rate limits;
- provider-specific error handling.

Не переносить billing/business rules в provider workers.

---

# 6. Worker autonomy

Provider worker может автономно:

- synchronise reviews;
- discover locations;
- maintain provider session;
- perform pagination;
- refresh provider-specific state;
- retry safe read operations.

Core не обязан создавать Job для каждого GET.

Jobs/commands использовать прежде всего для высокоуровневых write-действий:

- `REPLY_REVIEW`;
- `EDIT_REVIEW_REPLY`;
- `DELETE_REVIEW_REPLY`;
- `APPEAL_REVIEW`.

Не дробить одну provider operation на десятки business jobs.

---

# 7. Technical access is not authorization

Критический инвариант:

> Если technical account видит Location, это НЕ означает, что Yard имеет право её обслуживать.

Worker может обнаружить точку и отправить её Core как `DISCOVERED`.

Обрабатывать точку разрешено только если Core выдал active assignment / entitlement.

Никогда не включать автоматически все доступные provider locations.

---

# 8. Location isolation

Каждая операция с review должна быть привязана к конкретной Location.

Перед write:

- проверить internal `locationId`;
- проверить `platformLocationId`;
- проверить provider external location ID;
- проверить subscription/entitlement;
- проверить принадлежность review этой точке.

Не выполнять write только по `reviewId`.

---

# 9. Subscription rules

Provider worker не должен самостоятельно интерпретировать payment tables.

Core формирует разрешённые assignments.

При истечении subscription:

```text
Location
→ no longer active
→ removed/disabled in worker assignment
→ worker stops service
```

Workers не должны знать детали YooKassa.

---

# 10. Connector abstraction

Не связывать Core напрямую с Яндекс/Google/2ГИС.

Использовать provider adapters/connectors.

Концептуальные operations:

```text
discoverLocations()
listReviews()
getReview()
writeReply()
editReply()
deleteReply()
submitAppeal()
getAppealStatus()
checkConnection()
```

Capabilities могут отличаться по provider.

Не симулировать unsupported capability.

---

# 11. Yandex source of truth

Перед изменениями Yandex connector читать:

```text
YANDEX_DISCOVERY.md
```

Не придумывать endpoint, payload или token semantics.

Использовать только:

- фактически наблюдавшиеся contracts;
- подтверждённые результаты PoC;
- актуальную документацию.

Если discovery противоречит предположению — discovery имеет приоритет.

---

# 12. Yandex integration direction

Текущее направление:

```text
Playwright BrowserContext
        │
        ├── Page
        │    manual login / re-login
        │
        └── APIRequestContext
             provider HTTP operations
```

Browser UI не должен использоваться для каждого действия, если HTTP operation доказана.

Не копировать cookies в отдельный Java HTTP client без необходимости.

---

# 13. Yandex CSRF/session

Никогда не считать, что shared cookies автоматически решают CSRF.

Connector должен получать актуальные provider-specific tokens из provider state/responses.

Не hardcode:

- CSRF;
- cookies;
- X-Yandex-ICookie;
- review token;
- session identifiers.

Не логировать значения.

---

# 14. BrowserContext isolation

Один technical account → один изолированный BrowserContext.

Не использовать несколько обычных вкладок одного context как изоляцию аккаунтов.

Один worker process может обслуживать несколько BrowserContext.

Не создавать container на каждого клиента без доказанной необходимости.

---

# 15. Write safety

Перед write operation обязательно:

1. проверить assignment;
2. проверить active entitlement;
3. перечитать provider state при необходимости;
4. проверить Location/provider ID;
5. использовать свежие provider tokens;
6. выполнить operation;
7. verify/reconcile result.

HTTP 200 не всегда означает финальный опубликованный результат.

---

# 16. Idempotency

При timeout/unknown outcome:

НЕ делать слепой retry write.

Сначала:

```text
read provider state
↓
operation already applied?
```

Если да — reconcile as success.

Если нет — controlled retry.

Особенно важно для:

- reply;
- edit;
- delete;
- appeal.

---

# 17. Polling

Polling logic принадлежит worker.

Не использовать `unread=true` как единственный источник отзывов без ответа.

Нужны:

- overlap;
- deduplication;
- checkpoints;
- periodic deeper reconciliation.

Интервалы определяются измерениями.

Не использовать агрессивный polling без необходимости.

---

# 18. AI

AI не находится внутри provider worker.

Worker только доставляет provider data и исполняет provider command.

AI logic находится в Core/AI service.

MVP:

```text
Review
→ AI suggestion
→ human approval/edit
→ provider command
```

Auto-reply — будущая настройка, не базовый режим.

---

# 19. Telegram / MAX

Telegram/MAX — интерфейсы и notification channels.

Не помещать бизнес-логику внутрь bot handlers.

Bots вызывают Yard Core API.

Сложная конфигурация выполняется в Web Cabinet / WebApp.

---

# 20. Database access

Provider workers не должны иметь произвольный доступ ко всем таблицам продукта.

Предпочтительно получать:

- assignments;
- commands;
- configuration;

через чёткий contract/API/queue.

Если на раннем PoC используется shared DB — это временное решение и должно быть явно отмечено.

---

# 21. Secrets

Никогда не коммитить:

- `.env`;
- passwords;
- cookies;
- storageState;
- access tokens;
- refresh tokens;
- CSRF values;
- session identifiers.

В repository:

```text
.env.example
```

Secrets должны жить в environment/secret storage.

---

# 22. Logging

Логи не должны содержать:

- cookies;
- Authorization;
- CSRF token values;
- raw storageState;
- client personal data без необходимости.

Разрешено логировать:

- request correlation ID;
- provider;
- location ID;
- endpoint name;
- status code;
- error category;
- duration.

---

# 23. Audit

Каждый business write должен иметь audit trail.

Минимум:

- who;
- workspace;
- location;
- provider;
- action;
- target review;
- requested payload hash/safe summary;
- result;
- timestamp;
- error/retry state.

---

# 24. Tenant isolation

Любой Core query должен проверять Workspace ownership.

Не использовать global lookup по review ID без tenant/location check.

Никогда не смешивать данные двух клиентов.

---

# 25. Error model

Использовать общие error categories:

- `AUTH_REQUIRED`;
- `FORBIDDEN`;
- `LOCATION_MISMATCH`;
- `REVIEW_NOT_FOUND`;
- `RATE_LIMITED`;
- `CAPTCHA_REQUIRED`;
- `CSRF_INVALID`;
- `PROVIDER_CONTRACT_CHANGED`;
- `TIMEOUT_UNKNOWN_RESULT`;
- `MODERATION_PENDING`;
- `PROVIDER_TEMPORARY_ERROR`.

Provider-specific детали можно сохранять в diagnostics.

---

# 26. M0 priority

Первый технический milestone:

```text
M0 — Yandex Connector PoC
```

Не начинать строить весь Yard до завершения M0.

M0 должен доказать:

- manual login;
- BrowserContext session;
- APIRequestContext;
- organizations;
- branches;
- reviews;
- pagination;
- two locations without UI switching;
- session restore;
- one verified write;
- auth-loss handling.

---

# 27. Tests

Любое значимое изменение должно иметь тесты.

Минимум:

- unit tests;
- integration tests для Core;
- contract tests/mocks для provider;
- negative cases;
- idempotency/retry cases.

Не делать реальные provider writes в автоматическом CI.

Real integration tests должны быть explicit/manual/staged.

---

# 28. Real external systems

Не отправлять автоматически:

- реальные ответы;
- реальные жалобы;
- delete/edit operations;

без явно разрешённого тестового сценария.

Mock tests не заменяют real PoC, но real provider operations должны быть controlled.

---

# 29. Documentation

После значимого milestone обновлять:

- `docs/STATUS.md`;
- `docs/IMPLEMENTATION_PLAN.md`;
- `docs/DECISIONS.md` при архитектурном решении;
- discovery docs при новых фактах.

Не оставлять важные решения только в Codex conversation.

---

# 30. ADR rule

Если требуется изменить утверждённую архитектуру:

- не менять молча;
- описать проблему;
- предложить вариант;
- создать ADR/decision;
- только после согласования внедрять существенное изменение.

Рутинный refactoring ADR не требует.

---

# 31. Keep MVP small

При каждой новой идее спросить:

> Нужна ли эта функция для review-only MVP?

Если нет — не реализовывать сейчас.

---

# 32. Avoid premature abstractions

Не создавать:

- universal multi-LLM router;
- generic workflow engine;
- plugin framework;
- service mesh;
- event-sourcing infrastructure;
- Kubernetes;

если текущий MVP этого не требует.

Проектировать расширяемые границы, но не строить ненужную инфраструктуру.

---

# 33. Code quality

Требования:

- явные domain boundaries;
- маленькие cohesive modules;
- понятные names;
- no hidden side effects;
- transactional correctness;
- validation;
- predictable exceptions;
- structured logging;
- migrations;
- tests.

Не оставлять TODO вместо обязательной логики milestone.

---

# 34. Review checklist

Перед завершением задачи агент обязан проверить:

- соответствует ли implementation актуальному ТЗ;
- не расширен ли MVP;
- не нарушена ли Location isolation;
- не обойдены ли entitlement checks;
- не утекли ли secrets;
- нет ли provider business logic в Core;
- нет ли billing logic в worker;
- обработаны ли unknown outcomes;
- есть ли tests;
- обновлена ли документация.

---

# 35. Autonomy

Агент может самостоятельно принимать обычные инженерные решения:

- private method names;
- package layout;
- test organization;
- refactoring;
- DTO implementation;
- internal helpers.

Нужно эскалировать, если решение меняет:

- product model;
- billing;
- security model;
- provider integration strategy;
- public API;
- tenant model;
- user workflow;
- approved architecture.

---

# 36. Source of truth priority

При противоречии:

1. latest explicit ADR / DECISIONS;
2. `YARD_TZ_v0.3.md`;
3. `ARCHITECTURE.md`;
4. provider discovery;
5. implementation plan;
6. status;
7. chat history.

Если конфликт критичен — остановить только спорную часть, зафиксировать вопрос, продолжить независимые задачи.

---

# 37. Definition of Done

Задача не готова только потому, что код компилируется.

Минимальный DoD:

- requirements implemented;
- build passes;
- tests pass;
- migrations valid;
- no secrets;
- no critical known bugs;
- logs safe;
- docs updated;
- review performed;
- architecture invariants preserved.

---

# 38. Final principle

Всегда сохранять эту границу:

```text
YARD CORE
= product truth

PROVIDER WORKER
= provider execution
```

и:

```text
Technical access
!=
Yard authorization
```

Это два главных инварианта проекта.

---

# 39. GitHub status handoff

После каждого implementation pass или прохода исправления review findings агент обязан оставить status report в связанном GitHub Issue согласно `docs/CODEX_HANDOFF_PROTOCOL.md`.

В report обязательно указать:

- PR;
- branch;
- commit SHA;
- реализованные изменения;
- закрытые review findings;
- tests и CI;
- blockers / open items;
- готовность к independent review.

Для follow-up fixes продолжать работу в существующей branch и существующем PR, если явно не дана команда создать новый PR.

Если GitHub API permissions не позволяют оставить Issue comment или обновить metadata, явно сообщить точную tooling limitation в финальном отчёте. Не создавать duplicate PR как обходной путь.
