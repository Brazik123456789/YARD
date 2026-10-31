# Yard

Yard («Ярд») — SaaS/AI-сервис для работы бизнеса с отзывами на геосервисах.

Первый MVP сфокусирован на отзывах из:

- Яндекс.Бизнес / Яндекс.Карты;
- Google Business Profile / Google Maps;
- 2ГИС.

## Текущий статус

Проект находится на старте разработки.

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
- [`docs/YARD_TZ_v0.3.md`](./docs/YARD_TZ_v0.3.md) — актуальное продуктовое и архитектурное ТЗ;
- [`docs/Yard_Development_Workflow_v0.2.md`](./docs/Yard_Development_Workflow_v0.2.md) — процесс разработки через GitHub Issues, Codex Cloud и Pull Requests;
- [`discovery/YANDEX_DISCOVERY.md`](./discovery/YANDEX_DISCOVERY.md) — результаты технического discovery Яндекс.Бизнеса.

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
│   ├── YARD_TZ_v0.3.md
│   ├── DEVELOPMENT_WORKFLOW.md
│   └── discovery/
│       └── YANDEX_DISCOVERY.md
│
├── backend/
├── frontend/
├── yandex-worker/
└── 2gis-worker/
```

Структура исходного кода может уточняться в ходе M0 и implementation planning.

## Development workflow

Основной процесс разработки:

```text
ChatGPT / Product discussion
        ↓
GitHub Issue
        ↓
Codex Cloud Task
        ↓
Dedicated Branch
        ↓
Commits
        ↓
Pull Request
        ↓
CI
        ↓
Independent Review
        ↓
Fixes
        ↓
Merge
```

`main` не должен использоваться для прямой разработки.

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
