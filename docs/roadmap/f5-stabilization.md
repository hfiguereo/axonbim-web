# F5-S — Estabilización post-MVP (adaptado)

Fuente: auditoría y cadena de instrucciones (2026-08-07), adaptadas al producto actual (**puertas + ventanas + gizmo** en rama).

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

OpenCascade · IFC · OPFS/PWA · Family Editor · Push & Pull · Playwright (siguiente cola) · refactor de `sessionStore`.

## Gate de salida

Validación técnica (tests) **y** validación humana (muro + puerta + ventana, undo, abrir/guardar). Ver `docs/roadmap/gates.md`.

**Estado: aprobado (2026-08-07).** Validación humana OK; typecheck/tests verdes; consola/Vite sin errores.  
Siguiente cola pendiente de autorización explícita: **Playwright**.
