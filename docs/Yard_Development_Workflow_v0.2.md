# Yard — процесс разработки с ChatGPT, Codex Cloud и GitHub

**Статус:** рабочий документ  
**Версия:** 0.2  
**Дата:** 01.11.2026  
**Проект:** Yard (Ярд)  
**Назначение:** зафиксировать, как именно организована разработка Yard: роли Азамата, ChatGPT, Codex Cloud, агентов/субагентов, GitHub, CI, локальной среды и независимого review.

---

# 1. Главная идея процесса

Разработка Yard строится не как постоянное ручное взаимодействие:

```text
Codex → Азамат → ChatGPT → Азамат → Codex
```

после каждого коммита.

Цель — организовать процесс так, чтобы:

1. Азамат и ChatGPT обсуждали продукт, требования и архитектурные решения.
2. Решения фиксировались в документах репозитория.
3. Codex Cloud получал крупные самостоятельные задачи.
4. Codex сам разбивал работу на этапы и подзадачи.
5. Для независимых частей Codex мог использовать агентов/субагентов.
6. Код автоматически проверялся тестами и CI.
7. Codex проводил self-review и отдельный reviewer-pass.
8. Результат попадал в GitHub.
9. Азамат подключался не после каждого коммита, а после крупного milestone или при реально спорном вопросе.
10. ChatGPT выполнял независимый архитектурный и кодовый аудит крупных завершённых частей.

Ключевая модель:

```text
Азамат + ChatGPT
  продукт / требования / архитектура
                 ↓
      Документы в GitHub
                 ↓
          Codex Cloud
                 ↓
     разработка и агенты
                 ↓
             CI
                 ↓
        Codex Review
                 ↓
             GitHub
                 ↓
     независимый review
        ChatGPT + Азамат
```

---

# 2. Разделение ответственности

## 2.1. Азамат

Азамат — владелец продукта и финальный принимающий решения.

Он отвечает за:

- формулирование бизнес-целей;
- принятие продуктовых решений;
- доступы к внешним системам;
- коммуникацию с Сергеем;
- приёмку важных пользовательских сценариев;
- подтверждение спорных архитектурных решений;
- финальное решение о релизе.

Азамат не должен:

- вручную контролировать каждый commit;
- переносить сообщения между ChatGPT и Codex каждые 20 минут;
- самостоятельно проверять каждую строку кода;
- быть постоянным посредником между агентами.

---

## 2.2. ChatGPT в обычном чате

ChatGPT используется прежде всего как:

- продуктовый архитектор;
- системный архитектор;
- технический консультант;
- помощник при проектировании;
- независимый reviewer;
- помощник при анализе багов;
- помощник при развитии ТЗ;
- помощник при принятии сложных решений.

Основные задачи ChatGPT:

```text
обсудить идею
      ↓
структурировать требования
      ↓
зафиксировать архитектуру
      ↓
обновить ТЗ
      ↓
подготовить правила для Codex
      ↓
проверить завершённый milestone
```

ChatGPT не является основным исполнителем разработки Yard.

Основной исполнитель кода — Codex.

---

## 2.3. Codex Cloud

Codex Cloud — основная среда автономной разработки Yard.

Codex получает:

- GitHub-репозиторий;
- актуальное ТЗ;
- AGENTS.md;
- архитектурные документы;
- план реализации;
- Definition of Done;
- тестовые secrets;
- Cloud Environment.

Codex отвечает за:

- анализ текущего состояния репозитория;
- декомпозицию задач;
- создание implementation plan;
- реализацию backend;
- реализацию frontend;
- тесты;
- миграции;
- инфраструктурные файлы;
- CI;
- документацию к изменениям;
- self-review;
- исправление найденных проблем;
- подготовку PR / commit;
- обновление STATUS.md.

Codex должен работать максимально автономно.

---

# 3. GitHub — единственный источник истины

Главное правило:

> История чатов не является единственным источником состояния проекта.

Центральное состояние Yard хранится в GitHub.

```text
GitHub = Source of Truth
```

В GitHub должны находиться:

```text
yard/
├── README.md
├── AGENTS.md
├── .gitignore
├── .env.example
│
├── docs/
│   ├── YARD_TZ.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── DEVELOPMENT_WORKFLOW.md
│   └── STATUS.md
│
├── backend/
├── frontend/
├── yandex-worker/
└── ...
```

---

# 4. Назначение основных документов

## YARD_TZ.md

Описывает:

> что должен делать итоговый продукт Yard.

Содержит:

- продуктовую модель;
- User / Workspace / Location;
- биллинг;
- подписки;
- Яндекс.Бизнес;
- отзывы;
- контент;
- Telegram/MAX;
- админку;
- масштабирование;
- функциональные требования.

В этот документ не следует помещать процесс работы с Codex.

---

## ARCHITECTURE.md

Содержит техническую архитектуру:

- сервисы;
- модули;
- БД;
- очереди;
- интеграции;
- зависимости;
- sequence diagrams;
- infrastructure topology.

---

## DECISIONS.md

Фиксирует важные принятые решения.

Пример:

```text
ADR-001
Location — единица тарификации.

ADR-002
Яндекс.Бизнес автоматизируется через Playwright.

ADR-003
Write Job обязательно содержит locationId.

ADR-004
GitHub — source of truth.
```

Если в чате ChatGPT принимается новое важное решение, оно должно попасть сюда или в отдельные ADR.

---

## IMPLEMENTATION_PLAN.md

Создаётся и поддерживается Codex.

Содержит:

- milestones;
- зависимости;
- порядок реализации;
- Definition of Done;
- выполненные пункты;
- текущие блокеры.

---

## STATUS.md

Краткая текущая картина проекта.

Пример:

```text
Completed:
✅ M1 Project Skeleton
✅ M2 Core Domain

In Progress:
🟡 M3 Billing

Next:
M4 Yandex Discovery

Blocked:
- требуется доступ к Яндекс.Бизнесу Сергея
```

Этот файл особенно важен для:

- новых Codex task;
- нового чата ChatGPT;
- быстрого восстановления контекста.

---

## DEVELOPMENT_WORKFLOW.md

Это текущий документ.

Он описывает:

- кто за что отвечает;
- как работает Codex Cloud;
- как используются агенты;
- как устроены Git / PR / CI;
- когда проводится review;
- как работает локальная проверка.

---

## AGENTS.md

Главный операционный документ для Codex.

Он содержит правила, которые Codex обязан соблюдать при любой разработке.

Пример:

```text
- Java 21 / Spring Boot 3.
- PostgreSQL.
- React/Vite.
- Не использовать internal Yandex API как основу.
- Playwright — отдельный сервис.
- Любой write Job для карт обязан иметь locationId.
- Перед write-операцией проверять yandexOrganizationId.
- Не выполнять действия для Location без ACTIVE Subscription.
- Все значимые изменения покрывать тестами.
- Не менять утверждённую архитектуру молча.
- При необходимости изменения архитектуры создать ADR.
- Перед завершением задачи прогнать тесты и self-review.
```

AGENTS.md должен быть коротким, строгим и однозначным.

---

# 5. Старт проекта

## Этап 1 — локальная инициализация

Первый репозиторий можно создать локально на Mac.

Пример:

```text
mkdir yard
cd yard

git init
```

На старте кладём:

```text
README.md
AGENTS.md
.gitignore
.env.example

docs/
  YARD_TZ.md
  DEVELOPMENT_WORKFLOW.md
```

При необходимости:

```text
ARCHITECTURE.md
DECISIONS.md
```

---

## Этап 2 — первый commit

```text
git add .
git commit -m "Initial Yard project documentation"
```

---

## Этап 3 — GitHub

Создаётся private repository.

После этого:

```text
git remote add origin ...
git push -u origin main
```

С этого момента GitHub становится центральным источником состояния проекта.

---

# 6. Codex Cloud

После первого push:

```text
ChatGPT Desktop
        ↓
Codex
        ↓
Работать в: Облако
        ↓
Выберите среду
        ↓
Создать среду
        ↓
GitHub repository: yard
```

Создаётся Cloud Environment.

---

# 7. Cloud Environment

Cloud Environment должен содержать:

- GitHub repository;
- Java 21;
- Maven;
- Node.js;
- npm;
- Playwright;
- Chromium;
- необходимые build tools;
- тестовые environment variables;
- тестовые secrets.

В дальнейшем Environment переиспользуется.

---

# 8. Secrets

Реальные secrets нельзя хранить в Git.

Запрещено:

```text
.env
API keys
passwords
tokens
session state
```

коммитить в repository.

В Git хранится только:

```text
.env.example
```

Например:

```text
DB_HOST=
DB_USER=
DB_PASSWORD=

YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

YANDEX_AI_API_KEY=

TELEGRAM_BOT_TOKEN=
MAX_BOT_TOKEN=
```

Реальные значения:

- локально → `.env`;
- Codex Cloud → Cloud Environment Secrets;
- production → production secret storage.

---

# 9. Первый большой prompt для Codex

Codex не должен получать инструкцию:

> «Сделай весь Yard сразу».

Правильная инструкция:

1. изучить ТЗ;
2. изучить AGENTS.md;
3. проанализировать репозиторий;
4. подготовить implementation plan;
5. разбить работу на milestones;
6. определить зависимости;
7. определить Definition of Done;
8. только после этого начать реализацию.

Пример:

```text
Изучи полностью:

- docs/YARD_TZ.md
- AGENTS.md
- docs/ARCHITECTURE.md
- docs/DECISIONS.md

Не начинай реализацию вслепую.

Сначала:

1. создай/обнови IMPLEMENTATION_PLAN.md;
2. разбей работу на milestones;
3. зафиксируй зависимости;
4. для каждого milestone сформируй Definition of Done;
5. определи, какие части можно безопасно выполнять параллельно.

После этого начни первый доступный milestone.

Работай автономно.
После каждого крупного этапа:

- запускай тесты;
- проводи self-review;
- устраняй найденные проблемы;
- обновляй STATUS.md;
- фиксируй архитектурные решения в DECISIONS.md/ADR.

Не запрашивай подтверждение на рутинные инженерные решения,
если они не меняют продуктовые требования или утверждённую архитектуру.
```

---

# 10. Milestone-подход

Вместо одной бесконечной задачи Yard делится на крупные milestones.

Пример:

```text
M0  Repository / CI / skeleton
M1  Core Domain
M2  Auth / User / Workspace / Location
M3  Billing / Subscription
M4  Yandex Discovery
M5  Playwright Worker
M6  Reviews
M7  Yandex AI
M8  Telegram
M9  Client Cabinet
M10 Admin
M11 Content Automation
M12 E2E / Hardening
```

Конкретный план определяет Codex после анализа актуального ТЗ.

---

# 11. Использование агентов и субагентов

Codex может использовать несколько агентов для независимых частей.

Пример:

```text
Lead Codex
    │
    ├── Backend Agent
    ├── Frontend Agent
    ├── Test Agent
    ├── Infra/CI Agent
    └── Reviewer Agent
```

Lead Codex отвечает за:

- декомпозицию;
- распределение задач;
- согласование зависимостей;
- интеграцию результатов;
- финальную проверку.

---

# 12. Что можно выполнять параллельно

Хорошие кандидаты:

```text
Backend API
Frontend layout
CI
Docker
test infrastructure
documentation
```

если между ними заранее согласованы интерфейсы.

Пример:

```text
Agent A
→ Core Backend

Agent B
→ React shell + component library

Agent C
→ CI + Docker

Agent D
→ tests / fixtures
```

---

# 13. Что нельзя бездумно распараллеливать

Нельзя нескольким агентам одновременно независимо менять:

- одну и ту же схему БД;
- один и тот же SubscriptionService;
- один и тот же public API contract;
- одни и те же миграции;
- один и тот же Playwright page object;
- одну архитектурную область без согласования.

Для зависимых изменений:

```text
Design
  ↓
Contract
  ↓
Backend
  ↓
Frontend
```

лучше последовательный flow.

---

# 14. Lead Agent

Для больших задач один агент должен выполнять роль координатора.

Он:

1. читает ТЗ;
2. строит план;
3. определяет зависимости;
4. выделяет независимые workstream;
5. запускает подагентов;
6. интегрирует изменения;
7. разрешает конфликты;
8. запускает полный test suite;
9. проводит финальный review;
10. обновляет STATUS.md.

---

# 15. Self-review

Перед завершением milestone основной агент обязан:

- перечитать требования;
- сравнить реализацию с Definition of Done;
- запустить unit tests;
- запустить integration tests;
- запустить frontend tests;
- проверить migrations;
- проверить build;
- проверить lint/static analysis;
- проверить ошибки в логах;
- проверить TODO/FIXME;
- проверить отсутствие secrets;
- проверить документацию.

---

# 16. Отдельный Reviewer Agent

После self-review желательно запускать отдельный review другим агентом.

Его задача:

```text
ТЗ
  ↓
текущий diff
  ↓
архитектура
  ↓
тесты
  ↓
findings
```

Reviewer не должен автоматически считать решение автора правильным.

Он должен искать:

- логические баги;
- нарушение архитектуры;
- расхождение с ТЗ;
- security-проблемы;
- race conditions;
- проблемы транзакций;
- отсутствие проверок;
- недостающие тесты;
- плохую обработку ошибок;
- неверные boundary cases.

После findings основной агент исправляет проблемы и снова запускает CI.

---

# 17. CI как обязательный gate

Любой крупный merge должен проходить CI.

Минимум:

```text
Backend build
Backend tests
Frontend build
Frontend tests
DB migrations validation
Lint
Static analysis
Integration tests
```

В будущем:

```text
Security scan
Dependency scan
E2E
Playwright tests
Load tests
```

---

# 18. Git workflow

Рекомендуемая модель:

```text
main
```

защищена.

Codex работает в отдельных ветках:

```text
codex/m1-core
codex/m2-billing
codex/m3-yandex-discovery
```

Дальше:

```text
feature branch
      ↓
PR
      ↓
CI
      ↓
Codex Review
      ↓
fixes
      ↓
CI
      ↓
merge
```

---

# 19. Частота участия Азамата

Азамат не должен проверять каждый commit.

Подключение требуется:

- после завершения milestone;
- перед изменением бизнес-логики;
- при спорном UX;
- при внешнем блокере;
- при необходимости доступа;
- перед production release.

Нормальный цикл:

```text
Codex работает
      ↓
M1 завершён
      ↓
M2 завершён
      ↓
M3 завершён
      ↓
крупная контрольная точка
      ↓
Азамат + ChatGPT review
```

---

# 20. Когда обращаться к ChatGPT за review

Не после каждого commit.

Лучшие точки:

```text
закончена подсистема
закончена интеграция
готов PR большого milestone
появился архитектурный вопрос
обнаружен сложный баг
перед релизом
```

Пример запроса:

> Codex завершил M4 Yandex Discovery. Проверь репозиторий Yard, реализацию, тесты и соответствие ТЗ.

ChatGPT проводит независимый аудит.

---

# 21. Локальная работа Азамата

Локальный Mac не является главным местом разработки.

Это одна из рабочих копий.

Если нужно проверить результат:

```text
git pull
```

или:

```text
git clone ...
```

После этого можно:

- запустить backend;
- поднять Docker;
- открыть frontend;
- проверить Playwright;
- выполнить ручной smoke test.

---

# 22. Что делается локально / на RU VPS

Есть важное исключение:

> реальная интеграция с Яндекс.Бизнесом.

Production-подобный Playwright должен выполняться с российского окружения.

Поэтому:

```text
Codex Cloud
→ пишет код
→ пишет mocks/tests
→ пушит GitHub
```

а:

```text
Mac / RU Dev VPS
→ запускает реальный Chromium
→ работает с реальным Яндекс.Бизнесом
```

Причина:

- география IP;
- реальные сессии;
- CAPTCHA;
- особенности Яндекс.Бизнеса.

---

# 23. Реальный Yandex Browser Session

Нельзя помещать в Git:

```text
storageState.json
cookies
real account session
```

Реальная сессия:

- хранится локально или на RU VPS;
- защищена;
- не передаётся через repository.

Codex Cloud должен уметь разрабатывать worker без необходимости иметь production session.

---

# 24. External blockers

Codex не должен пытаться «выдумать» недоступную интеграцию.

Если требуется:

- доступ Сергея;
- реальный Yandex account;
- YooKassa account;
- Telegram Bot token;
- MAX token;
- production infrastructure;

задача фиксируется как blocker.

Пример:

```text
BLOCKED:
Yandex Discovery E2E requires access from Sergey's Yandex Business.
```

При этом Codex продолжает всё, что можно реализовать через mocks/contracts.

---

# 25. Continuity: что делать при новом чате ChatGPT

Если обычный чат ChatGPT потерял контекст, Азамат может передать:

```text
DEVELOPMENT_WORKFLOW.md
YARD_TZ.md
STATUS.md
```

После этого новый чат должен быстро восстановить:

- что строим;
- как устроена архитектура;
- как работает процесс разработки;
- текущий milestone;
- что должен делать ChatGPT;
- что должен делать Codex.

---

# 26. Continuity: что делать при новой Codex-задаче

Новая Codex-задача не должна зависеть исключительно от истории предыдущего task.

Она читает:

```text
AGENTS.md
YARD_TZ.md
ARCHITECTURE.md
DECISIONS.md
IMPLEMENTATION_PLAN.md
STATUS.md
```

Таким образом состояние проекта переносится через Git.

---

# 27. Обновление требований

Если Азамат и ChatGPT приняли новое решение:

```text
обсуждение
   ↓
решение
   ↓
обновление YARD_TZ / ADR
   ↓
commit
   ↓
Codex получает новую истину
```

Не следует полагаться на:

> «Я писал это Codex две недели назад в чате».

---

# 28. Приоритет документов

В случае противоречия ориентир:

```text
1. Последние явно утверждённые ADR / DECISIONS
2. Актуальная версия YARD_TZ
3. ARCHITECTURE
4. IMPLEMENTATION_PLAN
5. STATUS
6. История чатов
```

Если противоречие существенно — Codex должен остановить спорную часть и зафиксировать вопрос.

---

# 29. Definition of Done для milestone

Milestone нельзя считать готовым только потому, что код компилируется.

Минимальный DoD:

- требования milestone реализованы;
- build проходит;
- unit tests проходят;
- integration tests проходят;
- миграции валидны;
- нет известных критических багов;
- reviewer findings закрыты;
- документация обновлена;
- STATUS.md обновлён;
- нет secrets;
- нет незадокументированных архитектурных изменений.

---

# 30. Definition of Done для проекта MVP

MVP Yard считается готовым, когда работает полная пользовательская цепочка:

```text
регистрация
   ↓
Workspace
   ↓
Yandex discovery
   ↓
Location selection
   ↓
расчёт стоимости
   ↓
оплата
   ↓
Subscription ACTIVE
   ↓
новый отзыв
   ↓
AI reply
   ↓
approval
   ↓
Playwright
   ↓
публикация ответа
   ↓
audit
```

И весь flow покрыт интеграционными / E2E проверками настолько, насколько позволяют внешние системы.

---

# 31. Роль Pro-подписки

Pro используется для:

- интенсивной работы ChatGPT;
- интенсивной работы Codex;
- крупных Codex Cloud task;
- параллельной разработки;
- длительных автономных задач.

Но процесс разработки не должен зависеть от одного чата или одной сессии.

Состояние проекта хранится в Git.

---

# 32. Работа с Codex с телефона

После настройки Cloud Environment:

- задача может запускаться/контролироваться удалённо;
- Mac не должен быть постоянно включён для Cloud task;
- с телефона можно проверять статус;
- давать дополнительные инструкции;
- отвечать на вопросы;
- просматривать результат.

Основная логика:

```text
Codex Cloud
= работа происходит в облачном окружении

Этот компьютер
= работа происходит на Mac
```

Для Yard основной режим разработки — Cloud.

---

# 33. Что не нужно делать

Не нужно:

- проверять каждый commit вручную;
- постоянно копировать сообщения между Codex и ChatGPT;
- хранить архитектуру только в чатах;
- давать нескольким агентам конфликтующие задачи;
- коммитить secrets;
- давать Codex production credentials без необходимости;
- позволять агенту молча менять продуктовые требования;
- считать CI заменой независимого review;
- считать self-review единственным контролем качества.

---

# 34. Рекомендуемый полный цикл milestone

```text
1. Lead Codex читает STATUS / PLAN / TZ
2. Выбирает следующий milestone
3. Разбивает его на задачи
4. Определяет независимые workstream
5. Запускает subagents
6. Интегрирует изменения
7. Запускает tests
8. Делает self-review
9. Запускает reviewer-agent
10. Исправляет findings
11. Повторно запускает CI
12. Обновляет документацию
13. Обновляет STATUS.md
14. Создаёт/обновляет PR
15. Milestone завершён
```

После нескольких milestones:

```text
Азамат → ChatGPT:
"Проверь текущий Yard"
```

---

# 35. Пример структуры агентов

```text
Lead / Orchestrator
│
├── Domain Backend Agent
│   └── User / Workspace / Location
│
├── Billing Agent
│   └── Subscription / Payment / YooKassa
│
├── Yandex Agent
│   └── Discovery / Playwright
│
├── Frontend Agent
│   └── Client Cabinet
│
├── Admin Agent
│   └── Admin UI
│
├── Test Agent
│   └── unit / integration / E2E
│
├── DevOps Agent
│   └── CI / Docker / environment
│
└── Reviewer Agent
    └── independent audit
```

Не обязательно использовать всех одновременно.

Lead выбирает подходящую декомпозицию под текущий milestone.

---

# 36. Принцип автономности Codex

Codex должен самостоятельно принимать обычные инженерные решения:

- имена внутренних классов;
- небольшие refactoring;
- структура private methods;
- placement тестов;
- технические детали реализации.

Codex должен спрашивать/эскалировать только если решение меняет:

- продуктовую модель;
- публичный UX;
- тарификацию;
- безопасность;
- архитектурный фундамент;
- интеграционный контракт;
- данные клиента;
- внешнюю бизнес-логику.

---

# 37. Bug fixing

Если reviewer или CI нашёл баг:

```text
finding
   ↓
Codex
   ↓
fix
   ↓
test
   ↓
review again
```

Не нужно сразу возвращаться к Азамату.

Азамат подключается только если исправление требует изменения требований.

---

# 38. Документирование изменений

После milestone Codex должен записать:

```text
Что реализовано
Какие файлы изменены
Какие миграции добавлены
Какие API добавлены
Какие тесты добавлены
Какие ограничения остались
Какие blockers есть
Что делать дальше
```

Это можно хранить в:

- PR description;
- STATUS.md;
- changelog milestone.

---

# 39. Проверка ChatGPT

При независимой проверке ChatGPT должен смотреть минимум:

- соответствие YARD_TZ;
- архитектуру;
- модель данных;
- public API;
- error handling;
- security;
- billing correctness;
- subscription boundaries;
- Location isolation;
- Yandex Organization safety;
- Playwright robustness;
- concurrency;
- retries;
- tests;
- потенциальные regression.

---

# 40. Особое правило Yard: Location Isolation

Любая работа с Яндексом должна быть безопасно изолирована по Location.

Codex и reviewer обязаны постоянно проверять:

```text
Job имеет locationId?
Job имеет yandexOrganizationId?
Subscription активна?
Entitlement разрешает действие?
Worker сверил текущий Organization ID?
Контент относится к этой Location?
```

Это один из главных инвариантов системы.

---

# 41. Особое правило Yard: платежи

Ни одна write-операция Yard не должна выполняться только потому, что технический Yandex Agent видит филиал.

Всегда:

```text
Technical Access
        +
ACTIVE Subscription
        +
Entitlement
        +
Correct Location
        =
разрешение на действие
```

---

# 42. Планируемый рабочий процесс Yard

Итоговая схема:

```text
        АЗАМАТ
 Product Owner / Acceptance
          │
          ▼
       ChatGPT
 Product + Architecture
          │
          ▼
      GitHub Docs
          │
          ▼
      Codex Cloud
 Lead / Implementation
          │
   ┌──────┼────────┐
   ▼      ▼        ▼
Backend Frontend  Tests
Agent   Agent     Agent
   │      │        │
   └──────┼────────┘
          ▼
          CI
          ▼
    Reviewer Agent
          ▼
        GitHub
          ▼
 контрольная точка
          ▼
 Азамат + ChatGPT
 independent review
```

---

# 43. Что предоставить ChatGPT, если контекст потерян

Если этот документ используется для восстановления работы в новом чате, Азамат должен по возможности предоставить:

1. актуальный `YARD_TZ.md`;
2. этот `DEVELOPMENT_WORKFLOW.md`;
3. `STATUS.md`;
4. при необходимости `ARCHITECTURE.md`;
5. ссылку/доступ к GitHub repository.

После этого ChatGPT должен продолжать работу по этой схеме и не предлагать возвращаться к постоянному ручному контролю каждого коммита.

---

# 44. Что предоставить Codex

Перед крупной автономной разработкой Codex должен иметь доступ к:

```text
AGENTS.md
docs/YARD_TZ.md
docs/ARCHITECTURE.md
docs/DECISIONS.md
docs/IMPLEMENTATION_PLAN.md
docs/STATUS.md
```

Если часть файлов ещё не существует, Codex может создать их в первом planning milestone.

---

# 45. Главное правило процесса

> Решения принимаются людьми и фиксируются в репозитории.  
> Codex автономно реализует утверждённые решения.  
> CI и reviewer-агенты постоянно проверяют качество.  
> Азамат и ChatGPT подключаются на крупных контрольных точках, а не после каждого коммита.

---

# 46. Текущий план запуска процесса

1. Получить доступ к Яндекс.Бизнесу Сергея.
2. Обследовать сеть/филиалы.
3. Обновить `YARD_TZ.md` до v0.3.
4. Подготовить финальный `AGENTS.md`.
5. Создать локально repository Yard.
6. Добавить документы.
7. Сделать первый commit.
8. Push в GitHub.
9. Создать Codex Cloud Environment.
10. Подключить GitHub repository.
11. Настроить test secrets.
12. Дать Codex master prompt.
13. Codex создаёт implementation plan.
14. Codex начинает разработку по milestones.
15. CI + reviewer-agent проверяют работу.
16. После крупных milestones Азамат передаёт результат ChatGPT на независимый audit.
17. Локальные проверки выполняются через `git pull`.
18. Реальный Playwright Яндекс.Бизнеса тестируется локально или на RU VPS.

---

# 47. Статус документа

Этот документ описывает согласованный на 26.10.2026 процесс разработки Yard.

Он не является продуктовым ТЗ и не должен заменять `YARD_TZ.md`.

При изменении процесса разработки следует обновлять этот документ отдельно, не загрязняя продуктовые требования.

---

# 48. Основной GitHub / Codex Cloud workflow

Для Yard основной процесс разработки строится вокруг GitHub.

GitHub является:

- источником истины по коду;
- backlog задач;
- местом фиксации требований к реализации;
- местом хранения branch/commit history;
- местом Pull Request;
- местом code review и CI.

Codex Cloud является удалённым исполнителем разработки.

Основной процесс:

```text
Азамат + ChatGPT
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
ChatGPT / Codex Review
      ↓
Fixes
      ↓
CI green
      ↓
Азамат → Merge
```

Mac Азамата не должен быть обязательным участником этого цикла.

---

# 49. GitHub Issue = формальное задание

Каждая существенная задача разработки должна оформляться отдельным GitHub Issue.

Issue отвечает на вопросы:

```text
WHY
WHAT
BOUNDARIES
ACCEPTANCE CRITERIA
```

Рекомендуемая структура Issue:

```text
# M0 — Yandex Connector PoC

## Goal
Что необходимо получить в результате.

## Context
Почему задача нужна и какие решения уже приняты.

## Read before implementation
- AGENTS.md
- docs/YARD_TZ_v0.3.md
- docs/discovery/YANDEX_DISCOVERY.md

## Requirements
Конкретный перечень требований.

## Out of Scope
Что в рамках Issue делать нельзя.

## Acceptance Criteria
Проверяемые критерии завершения.

## Testing
Какие проверки должны пройти.

## Notes / Risks
Важные ограничения и известные риски.
```

Issue должен быть достаточно полным, чтобы Codex мог выполнить задачу без ручного переноса всей переписки из ChatGPT.

---

# 50. ChatGPT и GitHub Issues

Основной чат ChatGPT используется для:

- обсуждения продукта;
- архитектурных решений;
- постановки задач;
- анализа вариантов;
- подготовки содержимого Issue;
- независимого review.

После принятия решения конкретная задача переносится в GitHub Issue.

Таким образом важная постановка не остаётся только в истории чата.

Если ChatGPT имеет доступ к GitHub, предпочтительно работать с самим Issue, а не использовать Азамата как ручной транспорт между ChatGPT и Codex.

---

# 51. Запуск Codex Cloud Task

После создания Issue запускается отдельный Codex Cloud Task.

Базовая инструкция Codex может быть короткой:

```text
Implement GitHub Issue #<number>.

Before starting, read:
- AGENTS.md
- docs/YARD_TZ_v0.3.md
- relevant architecture/discovery documents.

First inspect the issue and repository.
Create an implementation plan before editing code.

Work in a dedicated branch.
Run required tests.
Perform self-review before completion.
Do not merge to main.

When finished:
- keep commits clean;
- prepare/update a Pull Request;
- summarize implementation;
- list tests executed;
- list known limitations and open questions.
```

Большие требования не нужно дублировать в Codex prompt, если они уже находятся в Issue и документации репозитория.

---

# 52. Branch strategy

Codex работает не напрямую в `main`.

Для каждой существенной задачи создаётся отдельная branch.

Пример:

```text
codex/1-yandex-connector-poc
codex/12-review-domain
codex/18-subscription-entitlements
```

Рекомендуется включить защиту `main`:

- запрет прямого push;
- изменения только через Pull Request;
- обязательный CI;
- merge после review.

---

# 53. Pull Request = фактический результат реализации

Разделение ответственности:

```text
Issue = что нужно сделать
Pull Request = что реально сделано
```

PR должен содержать:

- ссылку на Issue;
- краткое описание реализации;
- ключевые изменения;
- миграции;
- тесты;
- известные ограничения;
- оставшиеся вопросы;
- screenshots/log evidence при необходимости.

Пример:

```text
Implements #12

Implemented:
- isolated Yandex BrowserContext;
- APIRequestContext;
- organization discovery;
- review polling.

Tests:
- ...

Known limitations:
- ...
```

---

# 54. Codex self-review перед PR

До передачи результата на внешний review Codex обязан:

1. перечитать Issue;
2. перечитать Acceptance Criteria;
3. сверить результат с `AGENTS.md`;
4. запустить тесты;
5. проверить git diff;
6. проверить отсутствие secrets;
7. проверить отсутствие случайного расширения MVP;
8. выполнить self-review;
9. исправить найденные проблемы;
10. обновить документацию и `STATUS.md` при необходимости.

Только после этого задача считается готовой к review.

---

# 55. Независимый review

После готовности PR Азамат сообщает ChatGPT:

```text
Codex закончил Issue #12.
PR #13.
Проверяй.
```

ChatGPT проверяет:

```text
Issue
+
AGENTS.md
+
YARD_TZ
+
relevant discovery
+
PR diff
+
actual repository code
+
tests / CI
```

Review не должен ограничиваться пересказом отчёта Codex. Необходимо самостоятельно сверить фактический код с требованиями.

---

# 56. Findings из review

Findings желательно фиксировать непосредственно в Pull Request или связанном Issue.

Приоритеты:

```text
BLOCKER
HIGH
MEDIUM
LOW
```

Пример:

```text
BLOCKER

Yandex Worker начал polling всех discovered locations,
включая неоплаченные.

Нарушение:
Technical Access != Yard Authorization.

Expected:
Worker должен обслуживать только active assignments,
выданные Yard Core.
```

---

# 57. Исправление review findings

После review Codex Cloud продолжает работу в той же branch/PR.

Инструкция:

```text
Read the latest review feedback on PR #13.

Address all valid findings.
Do not ignore findings without explaining why.

Run the full relevant test suite again.
Perform self-review.
Update the PR summary if behavior changed.
Do not merge.
```

После исправлений:

```text
new commits
↓
PR updated
↓
CI
↓
repeat review if needed
```

---

# 58. Merge policy

На первых этапах Yard Codex не должен автоматически merge PR в `main`.

Финальный merge выполняет Азамат после:

- выполнения Acceptance Criteria;
- зелёного CI;
- закрытия BLOCKER/HIGH findings;
- независимого review;
- отсутствия известных критических проблем.

Схема:

```text
Issue
↓
Codex Cloud
↓
Branch
↓
PR
↓
CI
↓
Review
↓
Fix
↓
CI
↓
Азамат → Merge
```

---

# 59. Роль локального Mac

Mac является рабочей копией, но не обязательным узлом разработки.

Обычная разработка может выполняться в Codex Cloud.

Локальный Mac нужен, когда необходимо:

- выполнить ручной smoke test;
- визуально проверить frontend;
- проверить Docker Compose;
- выполнить real-provider сценарий, требующий ручного login;
- провести debugging, который удобнее локально.

Получение актуального состояния:

```text
git pull
```

или новый clone.

---

# 60. Параллельные Codex Cloud Tasks

Независимые задачи можно запускать параллельно, если они не конфликтуют по архитектуре и файлам.

Хорошие кандидаты:

```text
Task A → backend domain
Task B → frontend shell
Task C → CI
Task D → test infrastructure
```

Плохие кандидаты:

```text
два агента меняют одну DB schema;
два агента меняют один public API;
два агента меняют один provider connector;
два агента одновременно делают conflicting migrations.
```

Параллельные tasks должны работать в отдельных branches/PR.

---

# 61. Issues как backlog

GitHub Issues становятся рабочей очередью разработки.

Возможные labels:

```text
type:feature
type:bug
type:tech
type:discovery

provider:yandex
provider:google
provider:2gis

priority:p0
priority:p1
priority:p2

status:ready
status:blocked
status:review
```

Не обязательно внедрять все labels сразу. Главное — понятный scope и Acceptance Criteria.

---

# 62. Связь Milestone → Issues → PR

Milestone — крупная цель.

Пример:

```text
M0 — Yandex Connector PoC
```

Он может состоять из нескольких Issues:

```text
#1 Project skeleton for Yandex PoC
#2 Technical account runtime
#3 Location discovery
#4 Reviews polling
#5 Session restore
#6 Controlled write PoC
```

Каждый Issue может иметь свой PR.

Для небольшого milestone допустим один Issue и один PR. Не дробить работу искусственно, если это не даёт пользы.

---

# 63. Основное правило коммуникации

Не использовать Азамата как ручной транспорт сообщений:

```text
ChatGPT → Азамат → Codex → Азамат → ChatGPT
```

Предпочтительный поток:

```text
ChatGPT
↓
GitHub Issue / PR review

Codex
↓
GitHub branch / PR / comments

Азамат
↓
принимает продуктовые решения и merge
```

GitHub должен хранить передачу работы между участниками.

---

# 64. Итоговый development loop Yard

```text
1. В основном чате принимается решение.

2. Решение при необходимости фиксируется:
   - YARD_TZ;
   - DECISIONS/ADR;
   - discovery.

3. Создаётся GitHub Issue.

4. Codex Cloud получает Issue.

5. Codex:
   - читает AGENTS.md;
   - читает документацию;
   - планирует;
   - реализует;
   - тестирует;
   - делает self-review.

6. Codex создаёт/обновляет Pull Request.

7. CI проверяет PR.

8. ChatGPT выполняет независимый review.

9. Codex исправляет findings.

10. CI запускается повторно.

11. При необходимости review повторяется.

12. Азамат выполняет merge.

13. STATUS.md / IMPLEMENTATION_PLAN.md обновляются.

14. Берётся следующий Issue.
```

---

# 65. Главный принцип GitHub workflow

> GitHub Issue описывает обязательство.  
> Codex Cloud реализует его удалённо.  
> Pull Request показывает фактический результат.  
> CI и независимый review проверяют качество.  
> Азамат принимает финальный merge.

Этот процесс является базовым процессом разработки Yard.
