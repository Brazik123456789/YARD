# Yard — техническое задание и архитектурная концепция

**Версия:** 0.3  
**Дата:** 31 октября 2026  
**Статус:** рабочая приоритетная версия  
**Проект:** Yard («Ярд»)

---

# 1. Назначение документа

Этот документ является актуальной продуктовой и архитектурной спецификацией Yard.

Если более ранние версии ТЗ, обсуждения или документы противоречат этой версии, приоритет имеет этот документ, если иное явно не зафиксировано отдельным архитектурным решением.

Документ описывает:

- границы первого MVP;
- продуктовую модель;
- основные сущности;
- архитектурные принципы;
- модель интеграции с Яндекс.Бизнесом, Google Business Profile и 2ГИС;
- границу ответственности Yard Core и provider workers;
- модель подписок и разрешений;
- работу с отзывами;
- AI;
- клиентский и административный интерфейсы;
- требования к безопасности, аудиту и эксплуатации;
- последовательность технической реализации.

Этот документ **не описывает процесс разработки через Codex**. Процесс разработки хранится отдельно в `DEVELOPMENT_WORKFLOW.md`, а операционные правила агентов — в `AGENTS.md`.

---

# 2. Что такое Yard

Yard — SaaS/AI-сервис для автоматизации рутинной работы бизнеса с отзывами на геосервисах.

Первый продукт Yard должен объединять работу с отзывами из:

1. Яндекс.Бизнес / Яндекс.Карты;
2. Google Business Profile / Google Maps;
3. 2ГИС.

Клиент не должен постоянно заходить в три разных кабинета.

Yard должен:

- подключать организации и точки клиента;
- получать отзывы;
- показывать их в едином интерфейсе;
- генерировать AI-варианты ответа;
- позволять подтвердить, изменить или написать собственный ответ;
- публиковать ответ на соответствующей площадке;
- при наличии возможности площадки — поддерживать обжалование негативного отзыва;
- хранить историю действий и статусы;
- уведомлять клиента о важных событиях.

---

# 3. Главное изменение стратегии

Ранее Yard рассматривался как более широкий сервис управления карточками:

- публикации;
- новости;
- сторис;
- фотографии;
- редактирование карточек;
- SEO-аудит;
- аналитика;
- конкуренты;
- контроль качества;
- другие AI-функции.

В версии 0.3 первый продукт сознательно сужен.

## 3.1. Первый MVP — только отзывы

В MVP входят:

- подключение площадок;
- discovery организаций/точек;
- получение отзывов;
- синхронизация отзывов;
- AI-предложение ответа;
- ручное подтверждение/редактирование ответа;
- публикация ответа;
- редактирование/удаление ответа, если поддерживается площадкой;
- обжалование отзыва, если поддерживается площадкой;
- статусы и история;
- уведомления;
- базовая модель подписки по точкам.

## 3.2. Не входит в первый MVP

Пока откладываются:

- публикации;
- новости;
- сторис;
- фотографии;
- товары и услуги;
- управление описанием организации;
- изменение телефонов, адресов и графика;
- SEO-аудит;
- анализ конкурентов;
- сложная аналитика;
- полноценное управление карточкой;
- контроль качества после оказания услуги;
- исходящие обращения к клиентам бизнеса;
- AI-обзвоны;
- иные ранее обсуждавшиеся модули.

Они могут появиться позднее как отдельные платные возможности Yard.

---

# 4. Основной пользовательский сценарий MVP

```text
Клиент регистрируется
        ↓
создаётся Workspace
        ↓
подключает Яндекс / Google / 2ГИС
        ↓
Yard обнаруживает доступные организации и точки
        ↓
клиент выбирает точки, которые хочет обслуживать
        ↓
система рассчитывает стоимость
        ↓
клиент оплачивает
        ↓
выбранные Location становятся ACTIVE
        ↓
provider workers начинают синхронизацию отзывов
        ↓
Yard показывает новые отзывы
        ↓
AI предлагает ответ
        ↓
клиент принимает / редактирует / пишет свой
        ↓
Yard публикует ответ на нужной площадке
        ↓
результат сохраняется в истории
```

Для негативного отзыва, если площадка поддерживает обжалование:

```text
Негативный отзыв
      ↓
AI / правила оценивают контекст
      ↓
клиент видит вариант ответа
      ↓
при наличии оснований:
"Обжаловать"
      ↓
Yard отправляет жалобу
      ↓
сохраняет факт подачи
      ↓
при наличии доступного статуса — отслеживает результат
```

---

# 5. Ключевые продуктовые принципы

## 5.1. Technical access ≠ Yard authorization

Если технический аккаунт Yard видит организацию или филиал, это **не означает**, что Yard имеет право выполнять с ним действия.

Разделяются:

### Technical Access

Что технический аккаунт площадки реально видит.

### Yard Authorization

Что клиент выбрал, оплатил и разрешил Yard обслуживать.

Пример:

```text
Технический аккаунт видит 12 точек.

Оплачено 2.

Yard может работать только с этими 2.
```

Никакой provider worker не должен считать сам факт доступа достаточным основанием для обработки точки.

## 5.2. Location — основная коммерческая единица

Основная единица продукта и будущей тарификации — конкретная физическая точка бизнеса.

Один клиент может иметь:

- несколько юридических лиц;
- несколько брендов;
- несколько сетей;
- несколько физических точек;
- точки на нескольких геосервисах.

Подписка и entitlement должны быть привязаны к конкретной `Location`.

## 5.3. Provider-independent core

Бизнес-логика Yard не должна зависеть от Яндекса, Google или 2ГИС.

Внутри Yard используется единая модель:

- Customer;
- Workspace;
- Location;
- PlatformConnection;
- PlatformLocation;
- Review;
- ReviewReply;
- Appeal;
- Subscription;
- Entitlement.

Конкретный connector переводит действия Yard в формат площадки.

---

# 6. Основные сущности

## 6.1. User

Человек, который входит в Yard.

Минимально:

- `id`;
- `email/phone`;
- `status`;
- `createdAt`.

В будущем пользователь может состоять в нескольких Workspace.

## 6.2. Workspace

Клиентское пространство Yard.

Это не обязательно юридическое лицо.

Workspace содержит:

- пользователей;
- бизнесы;
- Locations;
- platform connections;
- subscriptions;
- billing profile.

## 6.3. Customer / Business

`Customer` — бизнес-клиент Yard.

`Business` — опциональная логическая сущность бренда/направления внутри Workspace.

В MVP UI может не требовать отдельного Business, если это усложняет сценарий.

## 6.4. Location

Конкретная физическая точка бизнеса.

Пример:

```text
Главпрокат
└── Оренбург, Шарлыкское шоссе 1/2
```

Location — основная сущность, с которой связываются:

- subscriptions;
- reviews;
- platform locations;
- entitlements;
- jobs;
- notifications;
- audit.

## 6.5. PlatformConnection

Подключение Workspace к конкретной площадке.

Пример:

```text
provider = YANDEX
technicalAccountId = ...
status = CONNECTED
```

Статусы:

- `PENDING`;
- `CONNECTED`;
- `AUTH_REQUIRED`;
- `ERROR`;
- `DISABLED`.

PlatformConnection не равен Location.

Один connection может видеть много точек.

## 6.6. PlatformLocation

Представление одной Location на конкретной площадке.

Поля:

- `id`;
- `locationId`;
- `provider`;
- `externalLocationId`;
- `externalNetworkId`, если есть;
- `externalName`;
- `externalAddress`;
- `status`;
- `discoveredAt`;
- `lastSeenAt`.

Одна физическая Location может иметь:

```text
Location
├── Yandex PlatformLocation
├── Google PlatformLocation
└── 2GIS PlatformLocation
```

## 6.7. Review

Единая внутренняя модель отзыва.

Минимальные поля:

- `id`;
- `provider`;
- `platformLocationId`;
- `externalReviewId`;
- `authorName`;
- `authorExternalId`, если есть;
- `rating`;
- `text`;
- `createdAtExternal`;
- `updatedAtExternal`, если есть;
- `replyState`;
- `rawMetadata`;
- `firstSeenAt`;
- `lastSeenAt`.

Уникальность:

```text
(provider, externalLocationId, externalReviewId)
```

или эквивалентный стабильный ключ конкретного provider.

## 6.8. ReviewReply

Хранит:

- предложенный AI-текст;
- финальный текст;
- автора подтверждения;
- provider status;
- moderation status;
- время отправки;
- время публикации;
- историю изменений.

## 6.9. Appeal

Хранит:

- review;
- provider;
- reason/text;
- факт отправки;
- provider status;
- результат, если доступен;
- timestamps;
- историю.

Факт HTTP 200 при отправке жалобы не равен положительному решению площадки.

---

# 7. Подписки и entitlements

## 7.1. Subscription

Подписка привязана к Location.

Пример:

```text
locationId = 123
status = ACTIVE
paidUntil = ...
plan = REVIEWS
```

Базовые статусы:

- `PENDING`;
- `ACTIVE`;
- `GRACE_PERIOD`;
- `SUSPENDED`;
- `EXPIRED`;
- `CANCELLED`.

## 7.2. Entitlements

Бизнес-правила не должны проверять название тарифа напрямую.

Используются permissions/capabilities:

- `REVIEWS_READ`;
- `REVIEWS_REPLY`;
- `REVIEWS_APPEAL`;
- `AI_REPLY`;
- `AUTO_REPLY` — в будущем;
- дополнительные возможности позже.

## 7.3. Кто принимает решение о допустимости действия

Yard Core — источник бизнес-истины.

Он решает:

- какие Locations обслуживаются;
- какие entitlements активны;
- какие write-действия разрешены;
- истекла ли подписка;
- нужно ли уведомить клиента.

Provider workers не должны самостоятельно реализовывать биллинг.

---

# 8. Core / Worker architecture

## 8.1. Основная модель

```text
Client Web / Telegram / MAX
              │
              ▼
        ┌──────────────┐
        │  YARD CORE   │
        │ Spring Boot  │
        └──────┬───────┘
               │
       PostgreSQL / Queue
               │
     ┌─────────┼─────────┐
     ▼         ▼         ▼
 Yandex     2GIS      Google
 Worker     Worker     Connector
```

Yard Core — модульный монолит.

Provider workers выносятся отдельно там, где требуется браузерная сессия или специфичная интеграционная среда.

## 8.2. Responsibility split

Главный принцип:

> Core определяет WHO / WHAT MAY BE DONE.  
> Worker определяет HOW / WHEN TECHNICALLY TO DO IT.

### Yard Core отвечает за:

- клиентов;
- Locations;
- subscriptions;
- entitlements;
- AI policy;
- тексты ответов;
- approval;
- уведомления;
- историю;
- создание бизнес-команд;
- audit.

### Provider Worker отвечает за:

- provider auth/session;
- discovery;
- polling;
- pagination;
- provider-specific IDs;
- CSRF;
- cookies/tokens;
- retries;
- rate limits;
- HTTP endpoints;
- browser recovery;
- provider-specific error handling.

---

# 9. Autonomy of provider workers

Provider worker не обязан ждать отдельного Job для каждого технического GET.

Он может иметь собственный автономный loop.

Пример:

```text
получить список разрешённых assignments
        ↓
каждые N минут:
    синхронизировать reviews
    обновлять provider state
    проверять session
    обрабатывать pagination
```

Core не создаёт отдельный Job для:

- `GET reviews`;
- перехода по странице;
- получения CSRF;
- обновления provider session;
- внутренних retries.

Это детали connector/worker.

## 9.1. Worker assignments

Core передаёт worker список точек, которые ему разрешено обслуживать.

Пример:

```text
provider = YANDEX
technicalAccount = yandex-agent-01

Location A
READ_REVIEWS
REPLY_REVIEWS
APPEAL_REVIEWS

Location B
READ_REVIEWS
REPLY_REVIEWS
```

Worker кеширует assignments и обновляет их:

- по событию;
- периодической синхронизацией;
- после восстановления связи.

## 9.2. Новая обнаруженная точка

Если provider worker видит новую точку:

```text
Technical account
→ обнаружил Location C
```

он сообщает Core:

```text
PlatformLocation = DISCOVERED
```

Но не начинает её обслуживать автоматически.

До выбора и оплаты:

```text
DISCOVERED
```

После выбора:

```text
SELECTED
```

После оплаты:

```text
ACTIVE
```

Только `ACTIVE` + нужный entitlement позволяют выполнять бизнес-действия.

---

# 10. Jobs / Commands

Jobs используются для **высокоуровневых write-действий**, а не для каждого HTTP-запроса.

Примеры:

- `REPLY_REVIEW`;
- `EDIT_REVIEW_REPLY`;
- `DELETE_REVIEW_REPLY`;
- `APPEAL_REVIEW`.

Пример:

```json
{
  "type": "REPLY_REVIEW",
  "provider": "YANDEX",
  "locationId": "123",
  "platformLocationId": "456",
  "reviewId": "789",
  "payload": {
    "text": "..."
  }
}
```

Worker сам выполняет техническую процедуру:

```text
проверить assignment
↓
получить свежий review state
↓
получить provider tokens
↓
выполнить request
↓
проверить результат
↓
вернуть outcome
```

Core не должен знать конкретные provider endpoints.

---

# 11. Safety перед write-операциями

Перед любой write-операцией должны быть проверки:

1. Location существует.
2. Location ACTIVE.
3. Subscription разрешает действие.
4. Entitlement присутствует.
5. PlatformLocation относится к этой Location.
6. Technical account имеет доступ.
7. Provider review принадлежит ожидаемой точке.
8. Provider session валидна.
9. Команда не является уже успешно выполненной.

Для браузерных провайдеров worker должен дополнительно проверять provider-specific идентификаторы перед записью.

---

# 12. Yandex connector — подтверждённое направление

По состоянию на 31 октября 2026 проведён технический discovery Яндекс.Бизнеса.

Файл:

```text
YANDEX_DISCOVERY.md
```

Он является техническим источником для Yandex connector.

Наблюдались внутренние HTTP-запросы кабинета для:

- списка организаций;
- списка филиалов;
- получения отзывов;
- создания ответа;
- изменения ответа;
- удаления ответа;
- отправки жалобы.

Официального публичного owner API для этих операций на момент discovery не подтверждено.

---

# 13. Yandex hybrid integration

Текущее рекомендуемое направление:

```text
Playwright BrowserContext
        │
        ├── Page
        │    └── ручной login / re-login
        │
        └── APIRequestContext
             └── рабочие HTTP-запросы
```

## 13.1. Browser responsibilities

Browser используется для:

- ручного login;
- CAPTCHA;
- 2FA;
- восстановления сессии;
- редких операций, если HTTP не покрывает сценарий.

Не хранить пароль Яндекс ID без необходимости.

## 13.2. APIRequestContext responsibilities

Связанный `APIRequestContext` должен использоваться для provider HTTP-вызовов, если PoC подтверждает их работоспособность без UI-навигации.

Cookies shared storage не означает автоматическое управление всеми прикладными токенами.

## 13.3. CSRF

Yandex connector должен уметь получать и использовать актуальные provider-specific CSRF values.

В discovery наблюдались, в частности:

- `list.csrf_token`;
- `business_answer_csrf_token`;
- `x-csrf-token`;
- `X-Yandex-ICookie`.

Значения никогда не сохраняются в git или документацию.

Конкретная обязательность и жизненный цикл должны быть проверены PoC.

---

# 14. Yandex technical accounts

На один технический аккаунт — отдельный изолированный BrowserContext.

Не считать обычные вкладки одного BrowserContext изоляцией аккаунтов.

Пример:

```text
Yandex Worker

BrowserContext #1
→ yandex-agent-01

BrowserContext #2
→ yandex-agent-02
```

Один worker process может обслуживать несколько BrowserContext.

Не создавать Docker container на каждого клиента без необходимости.

При росте нагрузки масштабировать worker processes горизонтально.

---

# 15. Служебный интерфейс администратора

Администратор Yard должен иметь защищённую страницу управления provider connections.

Пример:

```text
Technical Accounts

Yandex
- yard-agent-01  CONNECTED
- yard-agent-02  AUTH_REQUIRED

2GIS
- ...

Google
- ...
```

Действия:

- открыть браузер;
- проверить подключение;
- повторно войти;
- запустить;
- остановить;
- посмотреть доступные Locations;
- увидеть ошибки.

---

# 16. Сессия и refresh

Не делать архитектуру зависимой от постоянного refresh вкладки.

Нет подтверждения, что обновление страницы продлевает session.

Базовая модель:

```text
рабочий request
↓
успех → session valid

ошибка авторизации
↓
AUTH_REQUIRED
↓
stop account jobs
↓
notify admin
↓
manual re-login
```

Фоновый refresh может использоваться только как проверяемая экспериментальная настройка.

---

# 17. Polling отзывов

При отсутствии webhook provider worker выполняет polling.

Для Яндекса предварительное направление:

- сортировка по времени;
- overlap последних страниц;
- deduplication по provider IDs;
- периодическая более глубокая сверка истории;
- отдельная обработка изменённых/удалённых отзывов;
- не использовать `unread=true` как единственный источник отзывов без ответа.

Интервал определяется измерениями и требованиями продукта, а не догадкой.

---

# 18. Google connector

Для Google предпочтителен официальный Google Business Profile API.

Статус на 31 октября 2026:

- доступ к Business Profile получен;
- запрос на API отправлен;
- ожидается решение.

Не проектировать browser automation Google до результата официального API discovery.

Google connector должен реализовывать тот же внутренний интерфейс Yard, что и другие providers.

---

# 19. 2GIS connector

На 31 октября 2026 получен доступ в кабинет 2ГИС.

По полученному ответу 2ГИС публичного/предоставляемого API для полноценной работы с отзывами нет.

Необходимо провести отдельный технический discovery кабинета.

Приоритет:

1. фактический внутренний HTTP/XHR;
2. гибрид HTTP + browser session;
3. Playwright UI только если HTTP-вариант недостаточен.

Не предполагать заранее, что архитектура 2ГИС идентична Яндексу.

---

# 20. Общий connector interface

Концептуально provider connector должен предоставлять операции:

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

Наличие конкретной capability зависит от provider.

Использовать capability flags.

Пример:

```text
supportsReply = true
supportsReplyEdit = true
supportsReplyDelete = true
supportsAppeal = true
supportsAppealStatus = false
```

Не имитировать функцию, которой provider фактически не предоставляет.

---

# 21. Review synchronization

Provider workers обнаруживают внешние отзывы и передают их в Yard Core.

Core:

1. upsert Review;
2. привязывает к PlatformLocation;
3. сохраняет provider state;
4. определяет новый/изменённый review;
5. запускает нужную бизнес-логику.

Worker не должен сам генерировать финальный клиентский ответ.

---

# 22. AI

AI нужен прежде всего для:

- генерации варианта ответа;
- нескольких вариантов;
- адаптации под положительный/негативный контекст;
- tone of voice;
- классификации риска;
- рекомендации ручного вмешательства;
- анализа возможности обжалования.

AI не должен быть самоцелью.

## 22.1. MVP approval

В первой версии:

```text
Review
↓
AI suggestion
↓
Client approval/edit
↓
Provider command
```

Полностью автоматические ответы — будущая настройка.

## 22.2. AI provider

В MVP допускается Yandex AI/YandexGPT как основной provider.

Вызовы должны быть изолированы в отдельном AI service.

Бизнес-логика не должна зависеть от конкретной LLM.

Не строить сложный multi-provider router без необходимости.

---

# 23. Client Web Cabinet

Основной интерфейс управления рекомендуется делать web-based.

Функции:

- регистрация;
- onboarding;
- подключения площадок;
- список Locations;
- выбор обслуживаемых точек;
- тариф/стоимость;
- оплата;
- отзывы;
- AI suggestions;
- история;
- статусы;
- настройки;
- Telegram/MAX connection.

Telegram/MAX не должны становиться единственным местом управления сложной конфигурацией.

---

# 24. Telegram и MAX

Telegram и MAX — каналы оперативной работы и уведомлений.

Примеры:

```text
Новый негативный отзыв
AI предлагает ответ

[Ответить]
[Изменить]
[Обжаловать]
[Пропустить]
```

Также:

- subscription expiring;
- payment failed;
- provider auth required;
- appeal submitted/result;
- critical review.

Бизнес-логика не должна жить внутри ботов.

Они являются клиентами Yard Core API.

---

# 25. Billing

Кандидат payment provider — YooKassa.

Минимальные сущности:

- `Order`;
- `Payment`;
- `Subscription`.

После успешного webhook:

```text
Payment SUCCESS
↓
Subscription ACTIVE
↓
Worker assignment обновлён
```

При истечении:

```text
Subscription EXPIRED
↓
Location исключается из active assignments
↓
provider worker прекращает обслуживание
↓
клиент получает notification
```

Auto-renewal можно добавить позднее.

---

# 26. Notifications

Yard Core генерирует domain events.

Примеры:

- `REVIEW_RECEIVED`;
- `REVIEW_REPLY_READY`;
- `REVIEW_REPLY_PUBLISHED`;
- `REVIEW_REPLY_FAILED`;
- `REVIEW_APPEAL_SUBMITTED`;
- `SUBSCRIPTION_EXPIRING`;
- `SUBSCRIPTION_EXPIRED`;
- `PAYMENT_SUCCEEDED`;
- `PAYMENT_FAILED`;
- `PROVIDER_AUTH_REQUIRED`.

NotificationService доставляет события через:

- web;
- Telegram;
- MAX;
- email при необходимости.

---

# 27. Backend architecture

Рекомендуемый стек:

- Java 21;
- Spring Boot 3;
- Maven;
- PostgreSQL;
- Redis/RabbitMQ — при необходимости очереди;
- React/Vite;
- Playwright;
- Nginx;
- Docker;
- Prometheus/Grafana при необходимости.

Основной Yard Backend — модульный монолит.

Не делить Core на микросервисы без необходимости.

---

# 28. Provider workers

Отдельные worker applications допустимы для:

- Yandex;
- 2GIS;
- Google, если потребуется специфичный runtime.

На старте предпочтительно:

```text
yard-backend
yard-web
yard-yandex-worker
yard-2gis-worker
```

Google может первое время выполняться внутри backend или отдельного connector module, если официальный API не требует browser runtime.

---

# 29. Deployment

Не создавать container на каждого клиента.

Предпочтительно:

```text
Backend container
Frontend container
PostgreSQL
Yandex Worker container(s)
2GIS Worker container(s)
```

Внутри worker может жить несколько технических аккаунтов через изолированные BrowserContext.

При росте нагрузки — горизонтальный scale.

---

# 30. Audit

Все write-действия должны журналироваться.

Audit должен содержать:

- actor;
- workspace;
- location;
- provider;
- external IDs;
- action;
- previous state, если доступен;
- requested state;
- result;
- timestamp;
- error category;
- retry info.

Не хранить secrets.

---

# 31. Idempotency и retries

Особенно критично для ответов и жалоб.

При timeout нельзя слепо повторять write.

Алгоритм:

```text
write request
↓
timeout / unknown outcome
↓
read current provider state
↓
если действие уже применено
→ success/reconciled
иначе
→ controlled retry
```

Жалоба может быть одноразовой — повторять без проверки нельзя.

---

# 32. Error model

Минимальные категории:

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

Ошибки provider должны преобразовываться в общую модель Yard.

---

# 33. Security

Обязательные требования:

- не коммитить secrets;
- не логировать cookies/tokens;
- шифровать сохранённые session state;
- ограничивать доступ к admin browser;
- изолировать BrowserContext разных technical accounts;
- не хранить пароль площадки без необходимости;
- использовать роли;
- audit;
- rate limiting;
- безопасный webhook handling;
- tenant isolation;
- минимизация персональных данных.

---

# 34. Tenant isolation

Каждый запрос Core должен учитывать Workspace.

Нельзя получать review только по `reviewId` без проверки принадлежности к Workspace/Location.

Provider workers должны оперировать внутренними assignment IDs, выданными Core.

Данные разных клиентов не смешиваются.

---

# 35. Первый технический milestone — M0 Yandex Connector PoC

До разработки большого SaaS необходимо доказать ключевую техническую гипотезу.

Цель:

> Playwright BrowserContext держит сессию, а основные операции Яндекс.Бизнеса выполняются через связанный `APIRequestContext` без необходимости кликать UI для каждой точки.

## 35.1. M0 scope

1. Создать изолированный BrowserContext.
2. Открыть Chromium.
3. Ручной login в Яндекс.
4. `checkConnection()`.
5. Через `browserContext.request`:
   - получить organizations;
   - получить branches;
   - получить reviews первой точки;
   - получить reviews второй точки;
   - проверить pagination.
6. Не открывать UI каждой Location перед HTTP-запросом.
7. Проверить CSRF/session requirements.
8. Сохранить state.
9. Перезапустить process.
10. Восстановить session.
11. Повторить GET.
12. Выполнить один разрешённый real write test:
   - получить свежий review state;
   - получить актуальные CSRF values;
   - отправить ответ;
   - перечитать review;
   - подтвердить provider state.
13. Проверить обработку auth loss.

## 35.2. M0 Definition of Done

M0 считается успешным, если:

- один technical account успешно проходит manual login;
- APIRequestContext получает organizations/branches/reviews;
- запросы работают для двух Locations без UI navigation;
- pagination работает;
- session переживает согласованный restart либо явно зафиксирован механизм re-login;
- выполнен и подтверждён один write;
- secrets не логируются;
- документированы реальные ошибки;
- есть минимальные integration tests/mocks;
- Yandex connector оформлен как отдельная интеграционная граница.

---

# 36. Последующие milestones

Предварительно:

```text
M0  Yandex Connector PoC
M1  Project skeleton
M2  Core Domain
M3  Review Domain
M4  Subscription + Entitlements
M5  Worker assignments + commands
M6  Client Web Cabinet
M7  Telegram / MAX
M8  2GIS Connector
M9  Google Connector
M10 Billing productionization
M11 E2E / hardening
```

Порядок может уточняться после implementation planning Codex.

---

# 37. Что нельзя делать на старте

Не нужно:

- строить публикации/контент;
- реализовывать SEO-модули;
- писать сложную аналитику;
- создавать отдельный microservice на каждую сущность;
- создавать Docker container на каждого клиента;
- помещать billing logic в provider workers;
- давать workers доступ ко всем таблицам продукта;
- автоматически обслуживать все найденные точки;
- считать HTTP 200 от provider окончательным бизнес-результатом;
- хранить реальные provider secrets в документации;
- делать browser click automation там, где доказан стабильный HTTP route;
- строить весь Yard до подтверждения M0.

---

# 38. Open questions

## Yandex

- APIRequestContext вне UI;
- session restore;
- CSRF lifecycle;
- долгоживущая авторизация;
- лимиты;
- несколько независимых сетей;
- масштабирование technical accounts;
- appeal result.

## Google

- результат запроса Business Profile API;
- scopes;
- quotas;
- review/reply coverage;
- appeal coverage.

## 2GIS

- внутренние HTTP endpoints;
- auth/session;
- reviews;
- replies;
- appeal;
- scaling.

## Product

- финальные тарифы;
- стоимость per Location;
- billing periods;
- скидки;
- grace period;
- policy автоответов;
- notification settings.

---

# 39. Источники технической истины

Для текущего состояния:

```text
docs/YARD_TZ_v0.3.md
AGENTS.md
docs/discovery/YANDEX_DISCOVERY.md
docs/DECISIONS.md
docs/STATUS.md
```

История чатов не должна быть единственным источником проекта.

---

# 40. Итоговый архитектурный принцип

Главная граница Yard:

> Yard Core хранит продуктовую и коммерческую истину.  
> Provider Worker автономно обслуживает только разрешённую ему область и знает техническую механику конкретной площадки.

Иными словами:

```text
CORE:
WHO / WHAT MAY BE DONE

WORKER:
HOW / WHEN TECHNICALLY TO DO IT
```

Это правило должно сохраняться при добавлении Яндекса, Google, 2ГИС и будущих площадок.
