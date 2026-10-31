# Yard

Yard («Ярд») — SaaS/AI-сервис для работы бизнеса с отзывами на геосервисах.

Первый MVP сфокусирован на отзывах из:

- Яндекс.Бизнес / Яндекс.Карты;
- Google Business Profile / Google Maps;
- 2ГИС.

## Текущий статус

Проект находится на старте разработки.

Текущий основной roadmap хранится в [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md).

Первый технический milestone:

**M0 — Yandex Connector PoC**

Цель M0 — подтвердить рабочую схему:

```text
Playwright BrowserContext
        │
        ├── ручной login / re-login
        │
        └── APIRequestContext
             └── HTTP-запросы кабинета Яндекс.Бизнеса
```

Нужно доказать, что после ручной авторизации можно:

- получить доступные организации и филиалы;
- читать отзывы;
- работать с несколькими точками без UI-переключения;
- восстановить сессию после перезапуска;
- выполнить контролируемую write-операцию;
- корректно обработать потерю авторизации.

## Основные документы

Перед разработкой обязательно читать:

- [`AGENTS.md`](./AGENTS.md) — обязательные правила для Codex и coding agents;
- [`docs/CODEX_HANDOFF_PROTOCOL.md`](./docs/CODEX_HANDOFF_PROTOCOL.md) — **канонический процесс Issue → branch → review → READY FOR PR → final PR → merge**;
- [`docs/YARD_TZ_v0.3.md`](./docs/YARD_TZ_v0.3.md) — актуальное продуктовое и архитектурное ТЗ;
- [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) — **канонический master roadmap: текущий milestone, следующие этапы и Definition of Done**;
- [`docs/Yard_Development_Workflow_v0.2.md`](./docs/Yard_Development_Workflow_v0.2.md) — расширенное описание процесса разработки;
- [`discovery/YANDEX_DISCOVERY.md`](./discovery/YANDEX_DISCOVERY.md) — результаты технического discovery Яндекс.Бизнеса.

Если старые примеры workflow противоречат `docs/CODEX_HANDOFF_PROTOCOL.md`, **приоритет имеет `CODEX_HANDOFF_PROTOCOL.md`**.

Если старые предварительные списки milestones противоречат `docs/IMPLEMENTATION_PLAN.md`, **для порядка реализации приоритет имеет `IMPLEMENTATION_PLAN.md`**, пока это не меняет продуктовый scope или архитектурные инварианты из `YARD_TZ_v0.3.md`.

## Ключевой архитектурный принцип

```text
YARD CORE
= product truth

PROVIDER WORKER
= provider execution
```

И:

```text
Technical access
!=
Yard authorization
```

Yard Core определяет, **с какими точками и какие действия разрешены**.

Provider Worker определяет, **как технически выполнить работу на конкретной площадке**.

## Предварительный стек

Backend:

- Java 21;
- Spring Boot 3;
- Maven;
- PostgreSQL.

Frontend:

- React;
- Vite.

Интеграции:

- Playwright;
- Google Business Profile API — после получения доступа;
- provider-specific connectors для Яндекс и 2ГИС.

Инфраструктура:

- Docker;
- Redis/RabbitMQ — только при необходимости;
- Prometheus/Grafana — по мере развития.

## Предварительная структура репозитория

```text
yard/
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
│
├── docs/
│   ├── CODEX_HANDOFF_PROTOCOL.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── YARD_TZ_v0.3.md
│   └── Yard_Development_Workflow_v0.2.md
│
├── discovery/
│   └── YANDEX_DISCOVERY.md
│
├── backend/
├── frontend/
├── yandex-worker/
└── 2gis-worker/
```

Структура исходного кода может уточняться в ходе реализации roadmap.

## Development workflow

Канонический процесс разработки — **Issue-first / PR-late**:

```text
ChatGPT / Product discussion
        ↓
GitHub Issue OPEN
        ↓
Dedicated Branch
        ↓
Codex commits + status в Issue
        ↓
ChatGPT review branch / commits / tests
        ↓
Codex fixes в той же branch
        ↓
повторять до готовности
        ↓
ChatGPT: READY FOR PR
        ↓
ОДИН финальный Pull Request
        ↓
final CI / review
        ↓
Merge
        ↓
Issue CLOSED
        ↓
следующий Issue
```

**PR не создаётся в начале задачи.** Он появляется только после решения ChatGPT `READY FOR PR`, когда основная разработка и review уже завершены в branch.

Текущий `Issue #1 / PR #3` — историческое исключение, возникшее до фиксации этого правила. Начиная со следующей основной задачи применяется только новый процесс.

`main` не должен использоваться для прямой продуктовой разработки. Документационные source-of-truth изменения могут вноситься координатором напрямую, когда это явно согласовано.

## Secrets

Никогда не коммитить:

- `.env`;
- пароли;
- cookies;
- Playwright `storageState`;
- access/refresh tokens;
- CSRF values;
- session identifiers;
- API keys.

Для примера переменных используется только `.env.example`.

## License

Private project. License terms are not defined yet.