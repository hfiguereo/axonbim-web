# F5-S — Estabilización post-MVP (adaptado)

Fuente: auditoría y cadena de instrucciones (2026-08-07), adaptadas al producto actual
(**puertas + ventanas + gizmo**, ya fusionados en `main`).

## Objetivo

Corregir defectos de dominio/persistencia **antes** de Playwright u otras expansiones. No rehacer arquitectura.

## Alcance (producto actual)

Incluye **walls, doors y windows** (C con ventanas).

| # | Corrección | Estado |
|---|------------|--------|
| 1 | Sincronizar secuencias de ID tras importar/demo | hecho |
| 2 | `DeleteWallCommand` restaura muro + puertas + ventanas | hecho |
| 3 | Historial solo si el comando mutó | hecho |
| 4 | Validación `.axon` en el borde (sin Zod global) | hecho |
| 5 | Tests de regresión REG-01…09 | hecho |
| 6 | Sync docs (document-model, CHANGELOG, README stubs) | hecho |

## Orden de trabajo (adaptado)

Bloques pequeños; se pueden agrupar en un PR si cada corrección tiene test.

1. Diagnóstico (tests verdes baseline).
2. IDs (`syncIdSequencesFromDocument`).
3. Confirmar Undo muro+hospedados (ya hecho; tests).
4. `Command.execute` → `boolean` + `HistoryStack.push` condicional.
5. Parser `.axon` reforzado.
6. Documentación + gate humano.

## No hacer en F5-S

OpenCascade · IFC · OPFS/PWA · Family Editor · Push & Pull.

Ya desbloqueados **después** de F5-S, con autorización propia: Playwright (F8, aprobado
2026-08-08) y el refactor de `sessionStore` / `createViewport` (microcortes autorizados,
ver `refactor-session-viewer.md`).

## Gate de salida

Validación técnica (tests) **y** validación humana (muro + puerta + ventana, undo, abrir/guardar). Ver `docs/roadmap/gates.md`.

**Estado: aprobado (2026-08-07).** Validación humana OK; typecheck/tests verdes; consola/Vite sin errores.

Colas posteriores ya autorizadas y cerradas: **F8 Playwright** o1 + o2 + CI (2026-08-08).
Los cuatro hallazgos A de la auditoría están reverificados en el código
(`docs/validation/technical-audit-2026-08.md`, 2026-08-08).
