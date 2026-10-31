# Yard — Master Implementation Plan

**Версия:** 1.0  
**Дата:** 1 ноября 2026  
**Статус:** канонический roadmap реализации Yard до первого рабочего MVP  
**Текущий milestone:** `M0 — Yandex Connector PoC`  
**Текущий gate:** real local/provider validation

---

# 1. Назначение

Этот документ отвечает на три вопроса:

1. **Где сейчас находится разработка Yard?**
2. **Что должно быть реализовано следующим?**
3. **Какие milestones должны быть закрыты, чтобы получить первый рабочий MVP?**

Это master implementation roadmap проекта.

Он не заменяет:

- `docs/YARD_TZ_v0.3.md` — продуктовые требования и архитектурные принципы;
- `AGENTS.md` — обязательные инженерные правила;
- `docs/CODEX_HANDOFF_PROTOCOL.md` — канонический процесс Issue → branch → review → READY FOR PR → final PR → merge;
- provider discovery documents — фактическую техническую истину конкретной площадки;
- `docs/STATUS.md` — краткий текущий статус реализации.

Если порядок milestones в старых документах отличается от этого файла, **для порядка реализации приоритет имеет этот Implementation Plan**, пока это не меняет продуктовый scope или утверждённую архитектуру из `YARD_TZ_v0.3.md`.

---

# 2. Цель первого MVP

Первый Yard — это review-only SaaS для работы бизнеса с отзывами на:

- Яндекс.Бизнес / Яндекс.Карты;
- Google Business Profile / Google Maps;
- 2ГИС.

MVP должен позволять:

```text
регистрация клиента
↓
Workspace
↓
подключение площадок
↓
discovery доступных организаций / точек
↓
выбор обслуживаемых Locations
↓
расчёт стоимости
↓
оплата / активация
↓
синхронизация отзывов
↓
AI suggestion
↓
подтверждение / редактирование клиентом
↓
ответ на площадке
↓
при поддержке — appeal
↓
история / audit / notifications
```

В первый MVP **не входят** публикации, новости, сторис, фотографии, SEO, конкуренты, полноценное управление карточками, контроль качества, AI-обзвоны и другие будущие модули.

---

# 3. Архитектурные инварианты всего плана

На всех milestones сохраняются правила:

```text
YARD CORE
= product / commercial truth

PROVIDER WORKER
= provider execution
```

и:

```text
Technical access
!=
Yard authorization
```

Следствия:

- Location — основная коммерческая единица;
- provider worker не решает, оплачена ли точка;
- Core не знает внутренних provider endpoints;
- worker может обнаружить много точек, но обслуживает только разрешённые Core;
- browser/session/token logic остаётся внутри provider boundary;
- business write всегда проходит entitlement/location/audit checks;
- HTTP 200 от provider не считается автоматически финальным бизнес-результатом;
- unknown write outcome сначала reconciles через read, а не blind retry.

---

# 4. Как использовать milestones и Issues

Milestone — это **результат / gate**, а не обязательно один commit.

Работа ведётся по `docs/CODEX_HANDOFF_PROTOCOL.md`:

```text
один активный Issue
↓
dedicated branch
↓
Codex commits + status в Issue
↓
ChatGPT review branch / tests
↓
fix cycles в том же Issue / branch
↓
READY FOR PR
↓
один final PR
↓
merge
↓
Issue closed
↓
следующий Issue
```

По умолчанию следующий основной implementation Issue создаётся после закрытия предыдущего.

Допускаются параллельные **external/research tracks**, если основной код не зависит от их немедленного завершения, например ожидание Google API approval.

---

# 5. Статусы roadmap

Используются статусы:

- `DONE` — milestone закрыт;
- `CURRENT` — текущий основной milestone;
- `PLANNED` — запланирован;
- `EXTERNAL WAIT` — зависит от внешнего решения/доступа;
- `OPTIONAL / POST-MVP` — не нужен для первого MVP.

---

# 6. Roadmap summary

```text
M0   Yandex Connector PoC                           CURRENT
M1   Provider discovery + capability baseline       PLANNED
M2   Project skeleton + development foundation      PLANNED
M3   Core identity / tenant / location model        PLANNED
M4   Subscription + entitlement core                PLANNED
M5   Review domain + provider abstraction           PLANNED
M6   Worker assignments + commands + audit          PLANNED
M7   Yandex production connector                    PLANNED
M8   2GIS connector                                 PLANNED
M9   Google connector                               PLANNED / EXTERNAL WAIT
M10  AI reply workflow                              PLANNED
M11  Admin / provider operations console            PLANNED
M12  Client Web Cabinet + onboarding                PLANNED
M13  Pricing + billing + YooKassa                    PLANNED
M14  Notifications + Telegram / MAX                 PLANNED
M15  E2E hardening + deployment + observability     PLANNED
M16  Controlled pilot + MVP release                 PLANNED
```

Milestones ниже описывают ожидаемый результат. Детальная декомпозиция выполняется в GitHub Issues непосредственно перед реализацией milestone.

---

# M0 — Yandex Connector PoC

**Status:** `CURRENT`

## Goal

Доказать ключевую техническую гипотезу Яндекс-интеграции до строительства большого SaaS:

> ручной login и session живут в изолированном Playwright BrowserContext, а основные операции выполняются через связанный APIRequestContext без постоянной UI-навигации между точками.

## Уже реализовано в рабочей ветке Issue #1

- isolated BrowserContext per technical account;
- связанный APIRequestContext;
- organization discovery;
- branch/location discovery;
- reviews + pagination;
- две точки без заложенной UI-switch архитектуры;
- encrypted session state;
- restore experiment;
- auth-loss state;
- controlled reply implementation;
- unknown-result reconciliation;
- redacted request-state diagnostic;
- unit/mocked tests;
- CI для non-provider suite.

## Осталось доказать вручную

В approved local/RU environment:

1. real manual login;
2. organizations → branches → reviews двух Locations через APIRequestContext;
3. pagination;
4. новый process → restore session → authenticated read;
5. request-state diagnostic для `x-csrf-token` / `X-Yandex-ICookie`;
6. если bootstrap подтверждён — один отдельно разрешённый controlled reply;
7. reread результата / moderation state;
8. auth-loss behavior при реальном provider scenario, если безопасно воспроизводится.

## Definition of Done

M0 закрывается, когда:

- real read path подтверждён либо точно документирован blocker;
- two-location access без UI switching подтверждён;
- session restore/re-login model подтверждён;
- CSRF/write bootstrap не основан на догадке;
- выполнен один контролируемый write **или** зафиксирован доказанный provider blocker, требующий изменения стратегии;
- результаты внесены в `discovery/YANDEX_DISCOVERY.md`;
- финальный код и документы reviewed;
- final PR merged;
- Issue #1 закрыт.

## Not in M0

- Yard Core;
- клиентская регистрация;
- billing;
- AI;
- production scheduler;
- 2GIS / Google implementation;
- production scaling.

---

# M1 — Provider discovery + capability baseline

**Status:** `PLANNED`

## Goal

До фиксации production connector contracts понять реальные возможности всех трёх площадок и не строить Core на ложных предположениях.

M1 состоит из трёх частей.

## M1.A — Yandex discovery finalization

По результату M0:

- обновить подтверждённые session/token rules;
- зафиксировать read/write contracts;
- зафиксировать реально поддерживаемые reply/edit/delete/appeal operations;
- зафиксировать moderation/result semantics;
- зафиксировать auth recovery;
- определить PoC → production hardening gaps.

## M1.B — 2GIS technical discovery / PoC

Нужно подтвердить:

- account/access model;
- organizations/branches/locations;
- reviews;
- pagination;
- reply create/edit/delete;
- appeal, если есть;
- auth/session;
- internal XHR/HTTP;
- CSRF/tokens;
- возможность работать через HTTP + browser session;
- что действительно требует Playwright UI;
- session restore/re-login;
- provider capability limits.

Приоритет реализации:

```text
official API, если фактически доступен
↓
internal HTTP/XHR + authenticated browser session
↓
Playwright UI automation только для непокрытых операций
```

Не переносить Yandex assumptions на 2GIS без доказательств.

## M1.C — Google discovery / official API decision

Пока Google Business Profile API request находится на внешнем approval track.

После результата:

- подтвердить scopes/access model;
- accounts / locations discovery;
- review list/read;
- reply create/update/delete coverage;
- appeal coverage или отсутствие;
- pagination;
- quotas/rate limits;
- refresh/access token model;
- webhook/event возможности, если доступны;
- capability matrix.

Если официальный API одобрен — использовать его как основной путь.

Если официальный API недоступен/недостаточен — отдельно принять техническое решение перед browser discovery. Не начинать Google browser automation только потому, что это сделано для Яндекса.

## Deliverable

Создать единую provider capability matrix, например:

```text
Capability          Yandex     2GIS       Google
-------------------------------------------------
discoverLocations   yes/?      yes/?      yes/?
listReviews         yes        ?          ?
reply               yes        ?          ?
editReply            yes        ?          ?
deleteReply          yes        ?          ?
appeal                yes/?      ?          ?
appealStatus          ?          ?          ?
webhook               no known   ?          ?
browser session       yes        ?          no if API
```

И зафиксировать `ProviderConnector` v1 contract + capability flags.

## Definition of Done

- Yandex production gaps понятны;
- 2GIS integration direction доказана PoC/discovery;
- Google official path определён либо явно помечен `EXTERNAL WAIT`;
- общая capability model не требует выдумывать unsupported features;
- можно проектировать Core provider-independent.

---

# M2 — Project skeleton + development foundation

**Status:** `PLANNED`

## Goal

Создать production-oriented основу репозитория без преждевременной инфраструктуры.

## Scope

Предпочтительная структура:

```text
yard-backend/
yard-web/
yandex-worker/
2gis-worker/
```

Google остаётся backend connector module или отдельным worker только если это реально потребуется.

Backend baseline:

- Java 21;
- Spring Boot 3;
- Maven;
- PostgreSQL;
- schema migrations;
- health/readiness endpoints;
- structured config;
- local/dev profiles;
- safe secrets handling.

Frontend baseline:

- React;
- Vite;
- API client boundary;
- auth-ready routing/layout.

Development baseline:

- CI;
- tests;
- lint/static checks where useful;
- Docker/local run setup;
- `.env.example` only;
- repository docs aligned with actual paths.

## Do not add yet

- Kubernetes;
- service mesh;
- event sourcing;
- RabbitMQ/Redis unless a concrete requirement appears;
- microservice split of Core.

## Definition of Done

- backend and frontend boot locally;
- PostgreSQL migrations run cleanly;
- CI validates baseline;
- no secrets in git;
- structure is ready for domain implementation.

---

# M3 — Core identity / tenant / location model

**Status:** `PLANNED`

## Goal

Создать product truth, на который позже будут опираться providers, billing и UI.

## Entities

Минимально:

- `User`;
- `Workspace`;
- `Customer`;
- optional `Business`;
- `Location`;
- `PlatformConnection`;
- `PlatformLocation`.

## Required behavior

- tenant isolation by Workspace;
- User → Workspace membership/role;
- Customer != User;
- Workspace может иметь несколько Locations;
- одна физическая Location может иметь несколько PlatformLocations;
- provider IDs хранятся provider-scoped и не смешиваются;
- PlatformConnection имеет состояния `PENDING / CONNECTED / AUTH_REQUIRED / ERROR / DISABLED`;
- discovered provider location не становится автоматически active service location.

## Definition of Done

- migrations + repositories/services + API contracts;
- cross-tenant access tests;
- location/platform mapping tests;
- audit-friendly identifiers;
- нет provider-specific business logic в Core.

---

# M4 — Subscription + entitlement core

**Status:** `PLANNED`

## Goal

До реальных production writes создать единую бизнес-модель разрешений.

На этом milestone платежный provider ещё не обязателен. Subscription может активироваться admin/test способом.

## Entities / states

`Subscription` per Location:

- `PENDING`;
- `ACTIVE`;
- `GRACE_PERIOD`;
- `SUSPENDED`;
- `EXPIRED`;
- `CANCELLED`.

Entitlements:

- `REVIEWS_READ`;
- `REVIEWS_REPLY`;
- `REVIEWS_APPEAL`;
- `AI_REPLY`;
- `AUTO_REPLY` — reserved/post-MVP.

## Rules

- тарифное имя не проверяется внутри provider worker;
- business write допускает Core;
- Location без entitlement не обслуживается;
- technical visibility не активирует location;
- expiry выключает assignments.

## Definition of Done

- entitlement service работает;
- Location activation/deactivation работает;
- negative tests запрещают actions без entitlement;
- provider worker сможет получать готовый assignment, а не читать payment tables.

---

# M5 — Review domain + provider abstraction

**Status:** `PLANNED`

## Goal

Создать единый provider-independent review model.

## Core entities

- `Review`;
- `ReviewReply`;
- `Appeal`;
- provider capability model.

## Review requirements

Уникальность provider review должна учитывать provider + location + external review ID.

Хранить минимум:

- author/rating/text;
- external timestamps;
- provider location;
- reply state;
- moderation state;
- appeal state;
- firstSeenAt / lastSeenAt;
- safe raw metadata where justified.

## Connector abstraction

Conceptual operations:

```text
checkConnection()
discoverLocations()
listReviews()
getReview()          // only if provider actually supports / can implement safely
writeReply()
editReply()
deleteReply()
submitAppeal()
getAppealStatus()
```

Capabilities определяют, какие операции реально поддерживает provider.

## Synchronization

- upsert;
- dedupe;
- changed review detection;
- changed/deleted reply detection;
- provider status mapping;
- no assumption that unread == unanswered.

## Definition of Done

- Core может принять normalized review от любого provider;
- provider-specific payload не протекает в business logic;
- unsupported capabilities явно недоступны;
- review history/status model покрывает MVP actions.

---

# M6 — Worker assignments + commands + audit + reliability

**Status:** `PLANNED`

## Goal

Связать Core authorization с автономными provider workers.

## Assignments

Core выдаёт worker только разрешённые точки и capabilities.

Worker может автономно:

- polling reviews;
- pagination;
- provider session maintenance;
- safe read retries;
- provider-state refresh.

Но write выполняется только по high-level business command.

## Commands

Минимум:

- `REPLY_REVIEW`;
- `EDIT_REVIEW_REPLY`;
- `DELETE_REVIEW_REPLY`;
- `APPEAL_REVIEW`.

## Outcome / error model

Общие категории:

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

## Audit

Каждый business write должен сохранять:

- actor;
- workspace;
- location;
- provider;
- target review;
- action;
- safe requested state;
- result;
- timestamp;
- retry/reconciliation info.

Secrets в audit запрещены.

## Definition of Done

- worker не может обслужить неразрешённую Location;
- write commands location-scoped;
- idempotency/reconciliation tested;
- auth loss одного technical account не ломает остальные;
- audit trail есть для всех MVP writes.

---

# M7 — Yandex production connector

**Status:** `PLANNED`

## Goal

Превратить доказанный M0 PoC в connector/worker, подключённый к Yard Core.

## Scope

- technical account lifecycle;
- encrypted session persistence;
- manual login / re-login;
- organization/location discovery;
- polling reviews;
- pagination/checkpoints/overlap/dedupe;
- reply create/edit/delete согласно подтверждённым contracts;
- appeal согласно подтверждённым contracts;
- moderation/result reconciliation;
- assignment enforcement;
- command/outcome integration;
- auth required handling;
- provider contract change diagnostics;
- safe metrics/logging.

## Production hardening gap from PoC

Отдельно решить после M0:

- остаётся ли Node.js worker runtime;
- process supervision;
- multiple BrowserContexts;
- rate/backoff policy;
- persistent account configuration;
- recovery after process crash;
- safe browser access from admin UI.

Yard Core остаётся Java 21/Spring Boot независимо от runtime provider worker.

## Definition of Done

- Yandex end-to-end работает через Core для разрешённой Location;
- read sync работает автономно;
- write проходит entitlement + provider validation;
- session recovery/admin re-login работает;
- no secrets leak;
- real staging test пройден.

---

# M8 — 2GIS connector

**Status:** `PLANNED`

## Goal

Реализовать 2GIS provider boundary по фактам M1 discovery.

## Scope

- connection/auth/session;
- locations discovery;
- reviews sync;
- pagination;
- replies/edit/delete where supported;
- appeal where supported;
- capability flags;
- assignment enforcement;
- error mapping;
- rate/backoff;
- auth recovery;
- audit/outcomes.

Использовать HTTP/XHR + browser session, если discovery это подтверждает. Не делать UI click automation для операции, если доказан стабильный HTTP path.

## Definition of Done

- минимум reviews + reply workflow работает end-to-end;
- unsupported actions корректно скрыты/disabled;
- staging/real controlled tests пройдены;
- connector не зависит от Yandex-specific assumptions.

---

# M9 — Google connector

**Status:** `PLANNED / EXTERNAL WAIT` до результата API access

## Goal

Подключить Google через официальный Business Profile API, если доступ одобрен.

## Preferred scope

- OAuth/access model;
- accounts/locations discovery;
- reviews sync;
- reply create/update/delete, если покрывается API;
- quotas/backoff;
- token refresh;
- capability flags;
- error mapping;
- assignment enforcement;
- audit/outcomes.

Browser runtime для Google не добавляется без отдельного решения.

## Definition of Done

- Google Location mapping работает;
- review sync работает;
- поддерживаемые write capabilities проходят controlled test;
- quotas/auth refresh обработаны;
- отсутствие unsupported capabilities корректно отражается в UI/Core.

---

# M10 — AI reply workflow

**Status:** `PLANNED`

## Goal

Добавить AI как helper поверх уже работающего Review Domain, не помещая AI внутрь provider workers.

## MVP flow

```text
Review
↓
AI suggestion
↓
client approval / edit / own text
↓
Core command
↓
provider connector
```

## Scope

- AI service abstraction;
- provider configuration;
- prompt/version management;
- positive/negative context;
- tone of voice;
- safe length/provider constraints;
- risk/manual-intervention marker;
- appeal suggestion where justified;
- retry/failure fallback;
- audit of generated/final text without exposing secrets.

На старте можно использовать один LLM provider. Не строить multi-LLM router без необходимости.

## Not in MVP default

- automatic publishing without human approval;
- autonomous appeals;
- complex sentiment analytics.

## Definition of Done

- suggestion генерируется для normalized Review;
- клиент может edit/replace;
- AI failure не блокирует manual reply;
- final provider write всегда идёт через Core authorization.

---

# M11 — Admin / provider operations console

**Status:** `PLANNED`

## Goal

Дать администратору Yard безопасное управление provider connections и technical accounts.

## Scope

- список PlatformConnections / technical accounts;
- состояния `CONNECTED / CHECKING / AUTH_REQUIRED / ERROR / DISABLED`;
- Open browser / manual login для browser-based providers;
- Check connection;
- discovered organizations/locations;
- start/stop connection;
- last successful sync;
- provider errors;
- manual resync;
- safe diagnostics;
- audit view.

Никаких provider passwords в UI/DB без отдельно доказанной необходимости.

## Definition of Done

- оператор может восстановить auth без доступа к серверной консоли;
- одна сломанная account/session изолирована;
- admin действия audited;
- secrets не отображаются.

---

# M12 — Client Web Cabinet + onboarding

**Status:** `PLANNED`

## Goal

Собрать основной клиентский пользовательский путь Yard.

## Minimum screens / flows

### Registration / workspace

- register/login;
- create Workspace;
- basic profile.

### Provider onboarding

```text
подключить provider
↓
проверить доступ
↓
показать найденные organizations/locations
↓
выбрать Locations
```

### Reviews inbox

Для review показывать:

- provider;
- location;
- author;
- rating;
- text;
- date;
- current reply/moderation state;
- AI suggestion;
- available actions by provider capability + entitlement.

### Actions

- approve AI reply;
- edit;
- own reply;
- edit/delete existing reply where supported;
- appeal where supported;
- history/status.

### Settings

- connected providers;
- Locations;
- basic notification settings;
- subscription state placeholder/real integration.

## Definition of Done

- клиент проходит onboarding без admin/database manipulation;
- видит только свой Workspace;
- выбирает Locations до activation;
- review → AI/manual reply → provider result виден в одном интерфейсе;
- provider capability differences отражены корректно.

---

# M13 — Pricing + billing + YooKassa

**Status:** `PLANNED`

## Goal

Сделать Location selection коммерчески активируемым через реальную оплату.

## Scope

- pricing model per Location;
- calculator before payment;
- discounts rules if approved;
- `Order`;
- `Payment`;
- `Subscription` linkage;
- YooKassa create payment;
- secure webhook verification;
- payment success/failure;
- activation of selected Locations;
- expiration;
- grace/suspend rules;
- invoices/receipts integration requirements as applicable;
- billing history/status in cabinet.

## Required invariant

```text
Payment success
↓
Subscription ACTIVE
↓
Entitlements ACTIVE
↓
Worker assignment updated
```

and:

```text
Subscription expired/suspended
↓
assignment removed/disabled
↓
worker stops business service
```

## Initial simplification

Auto-renewal may be deferred. Manual/periodic renewal is acceptable for first pilot if product decision allows.

## Definition of Done

- выбранные Locations активируются только после разрешённого business state;
- webhook idempotent;
- duplicate payment event не создаёт duplicate activation;
- failed/expired state действительно отключает service;
- billing logic отсутствует в workers.

---

# M14 — Notifications + Telegram / MAX

**Status:** `PLANNED`

## Goal

Дать клиенту оперативный канал без переноса business logic в bot handlers.

## Domain events

Минимум:

- `REVIEW_RECEIVED`;
- `REVIEW_REPLY_READY`;
- `REVIEW_REPLY_PUBLISHED`;
- `REVIEW_REPLY_FAILED`;
- `REVIEW_APPEAL_SUBMITTED`;
- `PROVIDER_AUTH_REQUIRED`;
- `SUBSCRIPTION_EXPIRING`;
- `SUBSCRIPTION_EXPIRED`;
- `PAYMENT_SUCCEEDED`;
- `PAYMENT_FAILED`.

## Channels

Приоритет первого MVP:

1. web/in-app status;
2. email where necessary;
3. Telegram and/or MAX as operational channels.

Bot является клиентом Yard Core API.

Пример:

```text
Новый негативный отзыв
AI suggestion

[Ответить]
[Изменить]
[Обжаловать]
[Открыть в Yard]
```

## Definition of Done

- event generation отделено от delivery;
- notification failure не ломает provider write;
- bot не содержит subscription/provider business rules;
- пользователь может отключить ненужные уведомления.

---

# M15 — E2E hardening + deployment + observability

**Status:** `PLANNED`

## Goal

Подготовить систему не только к demo, а к реальному пилоту.

## Security

- tenant isolation review;
- secrets review;
- encrypted provider session state;
- secure admin browser access;
- webhook security;
- rate limiting;
- CSRF/auth for Yard itself;
- minimum roles;
- personal data minimization.

## Reliability

- idempotency tests;
- unknown write outcome tests;
- provider outage behavior;
- provider auth loss;
- provider contract change detection;
- retries/backoff;
- startup/restart recovery;
- DB migration/recovery tests.

## Observability

- structured logs;
- provider/account/location correlation IDs;
- metrics for sync success/error/latency;
- AUTH_REQUIRED alerts;
- queue/command lag if queue exists;
- health/readiness.

## Deployment

Target baseline:

```text
Nginx / reverse proxy
Yard backend
Yard web
PostgreSQL
Yandex worker(s)
2GIS worker(s)
Google connector/module
```

Server placement must satisfy actual provider/product/legal constraints; browser-based Russian-provider integrations should be validated in the chosen production region.

## Operations

- backup/restore;
- deployment runbook;
- provider re-login runbook;
- incident diagnostics;
- CI/CD;
- rollback path.

## Definition of Done

- full E2E test passes from onboarding to published reply;
- multi-tenant isolation tested;
- auth/session failure does not corrupt other customers;
- backup/restore verified;
- basic monitoring/alerts active;
- deploy is repeatable.

---

# M16 — Controlled pilot + MVP release

**Status:** `PLANNED`

## Goal

Проверить Yard на реальной эксплуатации до расширения продаж.

## Pilot scope

Начать с ограниченного числа реальных Locations и technical accounts, включая доступные тестовые/пилотные организации вроде «Главпрокат», если это остаётся согласованным pilot case.

Проверить реальный цикл:

```text
connection
↓
location discovery
↓
activation
↓
review sync
↓
AI suggestion
↓
human approval
↓
provider reply
↓
moderation/result
↓
history/audit
↓
notification
```

Дополнительно:

- auth lifetime;
- polling behavior;
- duplicate prevention;
- provider contract stability;
- real client UX;
- payment/subscription transitions;
- support/admin workload.

## MVP release gate

Первый MVP считается готовым к ограниченному коммерческому использованию, если:

- основные flows работают end-to-end;
- Yandex + 2GIS + Google имеют понятный production status; если одна площадка внешне заблокирована, это явно отражено в product availability и не маскируется;
- нет BLOCKER/HIGH security/tenant bugs;
- provider secrets защищены;
- billing activation/deactivation работает;
- audit доступен;
- auth recovery documented;
- monitoring exists;
- pilot feedback обработан;
- known limitations документированы.

---

# 7. Parallel external / product tracks

Некоторые работы не должны полностью останавливать основной roadmap.

## Track A — Google API approval

Статус может оставаться `EXTERNAL WAIT`, пока продолжаются Core/MVP работы, если Google не блокирует текущий milestone.

Нужно сохранять:

- заявку/access status;
- scopes/questions;
- provider decision;
- follow-up actions.

## Track B — 2GIS discovery

Можно начинать сразу после закрытия M0 или раньше только как отдельное research-направление, не смешивая его с Yandex implementation branch.

## Track C — Product/billing decisions

До M13 должны быть утверждены:

- цена per Location;
- billing period;
- discounts;
- grace period;
- cancellation/expiration behavior;
- refund/support rules where needed.

## Track D — AI policy

До production AI:

- tone defaults;
- dangerous/sensitive review handling;
- manual intervention policy;
- auto-reply policy (post-MVP opt-in unless explicitly changed).

---

# 8. What is intentionally deferred beyond first MVP

Не включать в milestones M0–M16 без отдельного product decision:

- posts/news/stories;
- photos/media management;
- products/services management;
- full Business Profile editing;
- SEO audit;
- competitor analytics;
- advanced BI/reporting;
- quality-control calls;
- outgoing customer outreach;
- AI calling;
- generic workflow engine;
- multi-LLM router;
- Kubernetes/service mesh;
- automatic reply as default mode;
- container per customer/account.

После pilot эти направления должны оформляться отдельными roadmap milestones, а не незаметно расширять review-only MVP.

---

# 9. Immediate next actions from current state

На 1 ноября 2026 порядок ближайших действий такой:

```text
1. Finish M0 real Yandex validation
   ↓
2. Record M0 findings in discovery/status
   ↓
3. Final review + merge Issue #1 / historical PR #3
   ↓
4. Close Issue #1
   ↓
5. Start M1 provider capability baseline
   - 2GIS technical discovery
   - Google API result/discovery track
   - finalize Yandex production gaps
   ↓
6. Freeze ProviderConnector v1 capabilities
   ↓
7. Start M2 project skeleton
```

Не начинать полноценный Yard Core до закрытия M0.

M1 может включать внешние ожидания Google, но это не должно бесконечно блокировать M2, если Yandex/2GIS contracts и provider abstraction уже достаточно определены. В таком случае Google остаётся отдельным external track с capability-based integration later.

---

# 10. Roadmap maintenance rule

После каждого закрытого milestone ChatGPT должен:

1. обновить статус milestone в этом файле;
2. обновить `docs/STATUS.md`;
3. зафиксировать существенные архитектурные решения в `docs/DECISIONS.md`;
4. обновить relevant provider discovery;
5. определить следующий основной Issue;
6. не менять будущий scope молча — значимое изменение roadmap должно быть явно отражено здесь.

`IMPLEMENTATION_PLAN.md` должен всегда позволять новому ChatGPT/Codex session без истории чата понять:

- что уже построено;
- где мы сейчас;
- какой следующий milestone;
- почему он следующий;
- какие gates нельзя обходить.
