# Codex ↔ ChatGPT GitHub Handoff Protocol

**Статус:** обязательный и канонический процесс разработки Yard  
**Дата:** 1 ноября 2026  
**Область:** GitHub Issues, Codex Cloud, branches, review, Pull Requests и merge

> Если этот документ противоречит более старым разделам `docs/Yard_Development_Workflow_v0.2.md` или старым примерам в других документах, **этот документ имеет приоритет для lifecycle Issue / branch / PR / merge**.

---

## 1. Главный принцип

Для Yard используется **Issue-first / PR-late workflow**.

```text
Issue = вся рабочая жизнь задачи
Branch = фактическая разработка
PR = финальный merge gate, создаётся только когда задача уже готова
```

Pull Request **не создаётся в начале задачи и не используется как основной рабочий канал промежуточных исправлений**.

Один Issue остаётся открытым от постановки задачи до успешного merge соответствующей реализации.

---

## 2. Канонический lifecycle задачи

```text
ChatGPT + Азамат принимают решение
        ↓
ChatGPT создаёт GitHub Issue
        ↓
Codex создаёт/использует dedicated branch
        ↓
Codex реализует задачу
        ↓
Codex push commits
        ↓
Codex пишет status report в Issue
        ↓
ChatGPT независимо проверяет branch / commits / tests / CI
        ↓
если есть замечания — ChatGPT пишет их в Issue
        ↓
Codex продолжает в ТОЙ ЖЕ branch
        ↓
новые commits + новый status report в Issue
        ↓
цикл повторяется столько раз, сколько нужно
        ↓
ChatGPT принимает решение READY FOR PR
        ↓
создаётся ОДИН финальный Pull Request
        ↓
финальная проверка diff / tests / CI / mergeability
        ↓
ChatGPT выполняет merge
        ↓
Issue закрывается
        ↓
ChatGPT создаёт следующий Issue
```

До решения `READY FOR PR` Codex **не должен создавать PR**, если ChatGPT явно не дал другую инструкцию.

---

## 3. Роли

### Азамат

- принимает продуктовые решения;
- запускает Codex Cloud короткой командой вида `Посмотри Issue #N и продолжай работу по нему`;
- подключается для ручного real-provider теста, продуктового выбора или явного разрешения внешнего write;
- не переносит вручную длинные задания, review findings и отчёты между ChatGPT и Codex;
- не обязан самостоятельно управлять branches/PR/merge, пока GitHub connection ChatGPT это позволяет.

### ChatGPT

- ведёт GitHub Issues как технический координатор;
- формулирует scope, boundaries и Acceptance Criteria;
- определяет, какая branch является рабочей;
- независимо проверяет commits, код, tests и CI;
- пишет findings и следующие инструкции в Issue;
- решает, когда задача достигла состояния `READY FOR PR`;
- только после этого создаёт/разрешает создать финальный PR;
- выполняет финальный review и merge;
- закрывает Issue после merge, если он не закрылся автоматически;
- создаёт следующий Issue только после завершения предыдущей основной задачи, кроме явно согласованной параллельной работы.

### Codex

- читает `AGENTS.md`, этот protocol, Issue и referenced project docs;
- работает в dedicated branch;
- push commits в эту branch;
- после каждого implementation/fix pass пишет status report в Issue;
- читает последние замечания из Issue и продолжает ту же branch;
- **не создаёт PR до команды/статуса `READY FOR PR`**;
- после создания финального PR не merge самостоятельно;
- не создаёт дополнительную branch/PR для того же Issue без явной команды.

---

## 4. Issue = основной рабочий канал

Issue является главным coordination thread задачи на всём протяжении разработки.

В Issue находятся:

- Goal;
- Context;
- Requirements;
- Out of Scope;
- Acceptance Criteria;
- обязательные документы;
- имя рабочей branch;
- status reports Codex;
- review findings ChatGPT;
- blockers;
- решения по спорным вопросам;
- отметка `READY FOR PR`, когда ChatGPT считает реализацию готовой;
- итог merge/закрытие.

Issue остаётся **OPEN**, пока код не прошёл финальный merge.

Не закрывать Issue только потому, что Codex написал код или считает задачу готовой.

---

## 5. Branch = фактическая разработка до PR

Для каждого Issue используется одна основная dedicated branch, если нет явной причины иначе.

Пример:

```text
codex/7-review-domain
```

До финального PR ChatGPT проверяет:

- новые commits;
- compare/diff branch относительно `main`;
- конкретные изменённые файлы;
- tests;
- CI, если workflow запускается для branch/push;
- соответствие Issue и документации.

Follow-up fixes делаются в **той же branch**.

Новый Codex Cloud task не означает новую branch. Новый task должен продолжать существующую branch задачи, если Issue не говорит обратного.

---

## 6. Обязательный status report Codex

После каждого implementation/fix pass Codex обязан оставить комментарий в связанном Issue.

До появления PR шаблон такой:

```text
## Codex status

Branch: <branch>
Commit: <sha>

Implemented:
- ...

Review findings addressed:
- ...

Tests:
- command → result

CI:
- status / not applicable

Still open / blocked:
- ...

Ready for coordinator review: YES / NO
```

После того как финальный PR уже создан, дополнительно указывается:

```text
PR: #<number>
```

Status report Codex является handoff, но не доказательством качества. ChatGPT всегда проверяет фактический код самостоятельно.

---

## 7. Review до PR

Основной технический review происходит **до создания PR**.

ChatGPT сверяет минимум:

```text
Issue
+
AGENTS.md
+
YARD_TZ
+
relevant discovery / ADR
+
branch commits / compare with main
+
actual code
+
tests / CI
```

Findings пишутся в Issue с приоритетом:

```text
BLOCKER
HIGH
MEDIUM
LOW
```

Codex затем исправляет их в той же branch и снова пишет status report в Issue.

Цикл может повторяться много раз без создания PR.

---

## 8. READY FOR PR

Только ChatGPT как технический координатор определяет, что задача готова к Pull Request.

Признак готовности фиксируется в Issue явно, например:

```text
READY FOR PR

Branch прошла независимый review.
BLOCKER/HIGH findings закрыты.
Automated tests/CI green.
Создать один финальный PR в main и не merge.
```

До такого сообщения Codex не должен создавать PR самостоятельно.

---

## 9. Pull Request = финальный merge gate

После `READY FOR PR` создаётся **один** Pull Request для данного Issue.

PR нужен для:

- финального целостного diff;
- финального CI;
- mergeability/conflict check;
- итоговой связи с Issue;
- merge в `main`.

PR не должен становиться новым многодневным рабочим backlog, если это можно было решить до его создания.

Если на финальном PR обнаружена небольшая проблема, допустим один короткий fix pass в той же branch/PR. Если обнаружена существенная недоработка, Issue остаётся открытым до её устранения.

PR body должен связывать задачу с Issue, например:

```text
Closes #7
```

---

## 10. Merge и закрытие Issue

Merge выполняется только когда:

- Acceptance Criteria выполнены либо явно принят внешний blocker;
- BLOCKER/HIGH findings закрыты;
- tests проходят;
- CI green, если применим;
- secrets отсутствуют;
- архитектурные инварианты соблюдены;
- documentation updated;
- финальный PR проверен ChatGPT.

По умолчанию merge выполняет ChatGPT через GitHub connection.

Если GitHub connection не позволяет merge, ChatGPT говорит Азамату конкретно:

```text
PR #N готов. Можно merge.
```

После успешного merge:

1. Issue закрывается автоматически через `Closes #N` либо ChatGPT закрывает его вручную;
2. фиксируется итог, если необходимо;
3. только затем создаётся следующий основной Issue.

---

## 11. Команда Азамата Codex

Обычная команда должна оставаться максимально короткой:

```text
Посмотри GitHub Issue #<N> и продолжай работу по нему.
```

Codex обязан сам из Issue понять:

- что делать;
- какую branch продолжать;
- какие findings закрыть;
- какие документы прочитать;
- нужен ли уже PR или PR пока запрещён.

Азамат не должен копировать содержимое Issue или review вручную.

---

## 12. Разделение каналов

```text
Issue comments
= task scope + coordination + status + findings + blockers + handoff

Branch / commits
= фактическая разработка до финального PR

Final Pull Request
= final diff + CI + merge gate

Repository docs
= долговременные правила, продукт и архитектура

Codex chat
= временный runtime conversation, не source of truth
```

Важная информация не должна оставаться только в интерфейсе Codex Cloud.

---

## 13. Duplicate branches / PRs

Для одного Issue по умолчанию должна быть одна рабочая branch и один финальный PR.

Если случайно появились дубли:

- ChatGPT выбирает одну основную branch;
- лишние PR закрываются как duplicate;
- лишние branches не используются для дальнейшей работы;
- дальнейшие инструкции фиксируются в Issue.

Codex не создаёт duplicate PR как workaround для API/permission ошибки.

---

## 14. Tooling limitations

Git push и GitHub API permissions могут отличаться.

Если Codex не может:

- оставить Issue comment;
- изменить metadata;
- создать финальный PR после `READY FOR PR`;

он обязан:

1. явно сообщить точную недоступную operation;
2. не создавать обходные дубли;
3. сохранить код в основной branch задачи;
4. дать ChatGPT выполнить metadata/PR operation через его GitHub connection.

---

## 15. Параллельные задачи

По умолчанию Yard ведётся последовательно:

```text
Issue N
→ готовность
→ final PR
→ merge
→ close Issue N
→ Issue N+1
```

Параллельный Issue разрешён только если ChatGPT и Азамат явно решили, что workstreams независимы и это ускоряет разработку без риска конфликтов.

Не создавать параллельные Issues автоматически.

---

## 16. Переходное правило для текущего M0

`Issue #1 / PR #3` появились до введения Issue-first / PR-late процесса.

Это **историческое исключение**, а не шаблон будущей работы.

Текущий PR #3 можно довести до завершения в существующем виде, чтобы не выбрасывать уже сделанную работу. Начиная со следующей основной задачи применяется только workflow из этого документа.

---

## 17. Восстановление контекста в новом ChatGPT-чате

Если текущий чат закончился или работа продолжена в другом чате, новый ChatGPT должен сначала прочитать минимум:

1. `AGENTS.md`;
2. `docs/CODEX_HANDOFF_PROTOCOL.md`;
3. `docs/YARD_TZ_v0.3.md`;
4. `docs/STATUS.md`, если существует;
5. активный GitHub Issue и его comments;
6. текущую рабочую branch / финальный PR, если он уже создан.

После этого новый чат должен продолжать тот же процесс и **не возвращаться к раннему созданию PR**.

---

## 18. Итоговый принцип

> Один Issue живёт всю задачу до merge.  
> Codex работает и исправляется в branch.  
> Codex отчитывается в Issue.  
> ChatGPT проверяет фактический код и ведёт Issue.  
> PR создаётся только в самом конце, после решения `READY FOR PR`.  
> После merge Issue закрывается и создаётся следующий Issue.  
> Азамат даёт Codex только короткие команды и принимает продуктовые решения.