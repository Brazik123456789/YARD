# Codex ↔ ChatGPT GitHub Handoff Protocol

**Статус:** обязательный процесс разработки Yard  
**Дата:** 1 ноября 2026  
**Область:** GitHub Issues, Codex Cloud, Pull Requests, review и merge

---

## 1. Назначение

Этот документ фиксирует, как ChatGPT и Codex передают работу друг другу через GitHub без ручного копирования длинных сообщений Азаматом.

Главный принцип:

```text
Issue = постановка задачи + статус + handoff
PR = фактический код + code review
```

Азамат не должен быть ручным транспортом между ChatGPT и Codex.

---

## 2. Роли

### Азамат

- принимает продуктовые решения;
- запускает Codex Cloud task короткой командой;
- подключается, когда требуется ручной real-provider test, продуктовый выбор или явное разрешение внешнего write;
- не обязан вручную переносить review findings, отчёты или технические задания между ChatGPT и Codex.

### ChatGPT

- ведёт GitHub Issues как технический координатор;
- формулирует scope и Acceptance Criteria;
- определяет активный PR/branch;
- закрывает дубликаты;
- независимо проверяет код, diff, tests и CI;
- фиксирует findings в PR;
- фиксирует координационные решения в Issue;
- решает, нужен ли следующий цикл исправлений;
- выполняет merge только когда gate действительно закрыт.

### Codex

- читает Issue и все указанные project docs;
- реализует задачу в выделенной branch;
- создаёт или обновляет ровно тот PR, который относится к Issue;
- читает последние review comments;
- исправляет findings в той же branch/PR;
- после каждого рабочего прохода оставляет итоговый status report в связанном Issue.

---

## 3. Что хранится в Issue

Issue является основным coordination thread задачи.

В Issue должны находиться:

- Goal;
- Context;
- Requirements;
- Out of Scope;
- Acceptance Criteria;
- ссылки на обязательные документы;
- текущий активный PR/branch;
- blockers;
- важные coordination decisions;
- status reports Codex после каждого прохода.

Issue не заменяет PR diff, но хранит понятное состояние задачи.

---

## 4. Что хранится в Pull Request

PR является источником истины о фактической реализации.

PR содержит:

- commits;
- diff;
- tests/CI;
- implementation summary;
- code-review findings;
- обсуждение конкретных проблем реализации.

ChatGPT никогда не считает задачу готовой только на основании отчёта Codex в Issue. Фактический код и проверки должны быть просмотрены независимо.

---

## 5. Обязательный status report Codex

После каждого прохода Codex обязан оставить комментарий в связанном GitHub Issue.

Минимальный шаблон:

```text
## Codex status

PR: #<number>
Branch: <branch>
Commit: <sha>

Implemented:
- ...

Review findings addressed:
- ...

Tests:
- command → result
- command → result

CI:
- status / link / not available

Still open / blocked:
- ...

Ready for independent review: YES / NO
```

Если Codex не может написать комментарий из-за GitHub permissions/API restrictions, он обязан явно сообщить об этом в своём финальном ответе. Тогда ChatGPT переносит status в Issue вручную, а ограничение фиксируется как tooling limitation.

---

## 6. Review flow

После status report ChatGPT выполняет независимый review:

```text
Issue
+
AGENTS.md
+
YARD_TZ
+
relevant discovery / ADR
+
PR diff
+
actual code
+
tests
+
CI
```

Findings фиксируются в PR.

Приоритеты:

```text
BLOCKER
HIGH
MEDIUM
LOW
```

Координационные решения, например какой PR считать основным или что предыдущий PR закрыт как duplicate, дополнительно фиксируются в Issue.

---

## 7. Follow-up fixes

Если ChatGPT нашёл проблемы:

- Codex продолжает работу в существующей branch;
- обновляет существующий PR;
- не создаёт новый PR для того же Issue без явной команды;
- после исправлений снова пишет status report в Issue;
- ChatGPT повторяет review.

Цикл:

```text
Issue
↓
Codex
↓
existing branch
↓
existing PR
↓
status report in Issue
↓
ChatGPT review
↓
findings
↓
Codex fixes
↓
status report
↓
review again
```

---

## 8. Команда Азамата Codex

После того как Issue подготовлен, команда может быть минимальной:

```text
Посмотри GitHub Issue #<N> и продолжай работу по нему.
```

Codex обязан сам:

- прочитать Issue;
- прочитать referenced docs;
- определить указанный активный PR/branch;
- прочитать последние review comments;
- выполнить работу;
- зафиксировать результат в GitHub.

Азамат не должен копировать длинные prompts между системами.

---

## 9. Duplicate tasks / PRs

Если случайно запущено несколько Cloud Tasks на один Issue:

- ChatGPT выбирает одну основную реализацию;
- лучший PR/branch остаётся активным;
- остальные PR закрываются как duplicate;
- дальнейшая работа продолжается только в основном PR;
- решение фиксируется в Issue.

Не merge две независимые реализации одной задачи без отдельной причины.

---

## 10. Merge gate

PR разрешено merge только после независимой проверки.

Минимум:

- Acceptance Criteria выполнены либо явно зафиксирован допустимый внешний blocker;
- BLOCKER/HIGH findings закрыты;
- automated tests проходят;
- CI проходит, если применим;
- secrets отсутствуют;
- архитектурные инварианты соблюдены;
- документация обновлена;
- Codex оставил финальный status report;
- ChatGPT проверил фактический код.

Codex не выполняет merge самостоятельно без явного изменения этого правила.

---

## 11. Разделение каналов

Использовать следующий принцип:

```text
Issue comments
= coordination + status + blockers + handoff

PR review/comments
= code findings + implementation discussion

Repository docs
= долговременные правила и архитектура

Codex chat
= временный runtime conversation, не source of truth
```

Важная информация не должна оставаться только в интерфейсе Codex Cloud.

---

## 12. Tooling limitations

Git push и GitHub API permissions могут отличаться.

Например, Codex может иметь возможность push в branch, но не иметь возможности:

- изменить PR description;
- оставить Issue comment;
- менять labels/metadata.

Такая ошибка не считается ошибкой реализации, если код успешно pushed.

В этом случае:

1. Codex сообщает точную недоступную GitHub operation;
2. не создаёт обходной новый PR;
3. ChatGPT выполняет доступную metadata-operation через своё GitHub connection;
4. разработка продолжается в том же PR.

---

## 13. Итоговый принцип

> Issue говорит, что нужно сделать и где сейчас находится задача.  
> Codex пишет код и возвращает status в Issue.  
> PR показывает, что реально изменено.  
> ChatGPT независимо проверяет код и управляет review/merge.  
> Азамат принимает продуктовые решения, но не переносит технические сообщения вручную.
