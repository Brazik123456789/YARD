# Decisions

## ADR-001 — Node.js is limited to the Yandex M0 worker PoC

**Status:** accepted for M0 only  
**Date:** 31 October 2026

Yard Core remains the approved Java 21, Spring Boot, Maven backend. The isolated Yandex connector PoC uses Node.js because Playwright is the subject of this narrow experiment and the runtime must not expand into the Core.

This decision does not change the Core technology stack. Revisit the worker runtime before production hardening, once the Yandex session and APIRequestContext hypotheses have been proven.
