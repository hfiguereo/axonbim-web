# Pendientes — hilo único de trabajo

**Fuente de verdad** para lo que queda por hacer. Si otro documento contradice este,
**prevalece este** hasta que se actualice explícitamente.

Última revisión: **2026-08-08** (plan «base limpia y desacople real» — Fases 0–3 hechas en código).

## Cola activa

Plan maestro: desacople real de `sessionStore` (slices Zustand) y `createViewport` (módulos).
Detalle en [`refactor-session-viewer.md`](refactor-session-viewer.md).

| Fase | Estado | Gate |
|------|--------|------|
| **0** Base operativa | **código hecho** · protección remota **pendiente en GitHub** | OK humano tras `scripts/setup-github-protection.sh` |
| **1** Session slices | **cerrada** | B5 session cerrado |
| **2** Viewer módulos | **cerrada** | B5 viewer cerrado |
| **3** Deuda residual | **cerrada** | base limpia declarada |
| **4** Desarrollo parked | **cola** | solo tras gate Fase 3 ✓ |

---

## Prioridad global (mayor → menor)

### 1. Proceso — protección remota (Hilo A)

| ID | Pendiente | Estado |
|----|-----------|--------|
| **A1** | Repo público + branch protection en `main` | **Script listo:** `scripts/setup-github-protection.sh`. Ejecutar con `gh` autenticado. Guardia complementaria: `pnpm check:history` en CI (push a `main`). |
| **A2** | Mantener docs al cerrar gates | Práctica continua; reverificar hallazgos contra código. |
| **A3** | Límite conocido de CI | Contract tests añadidos (Fase 3); e2e sigue siendo red de seguridad. |

---

### 2. Deuda técnica — monolitos (Hilo B)

| ID | Deuda | Estado |
|----|-------|--------|
| **B5 session** | `sessionStore.ts` | **cerrado** — compositor ~13 líneas; slices en `apps/web/src/session/` |
| **B5 viewer** | `createViewport.ts` | **cerrado** — compositor ~223 líneas; módulos en `packages/viewer/src/viewport*.ts`, `documentSceneSync.ts`, `cropOverlayLayer.ts` |

Cortes 1–7c: **histórico** (microcortes −7 %; estrategia abandonada como vía principal).

---

### 3. Decisiones de producto (Hilo C)

| ID | Tema | Decisión | Estado |
|----|------|----------|--------|
| **C1** | Umbrales de proximidad de clic | **Documentado** en `pickTolerance.ts`: entidad/grip 14 px, marco/flip 16 px. No unificar sin prueba de regresión. | **cerrado (MVP)** |
| **C2** | Bundle ~834 kB | **Aceptar en MVP**; revisitar solo si hay queja de carga. | **cerrado (MVP)** |
| **C3** | Crop editable en más vistas | **Parked** hasta Fase 4 | **parked** |

---

### 4. Fase 4 — desarrollo y features parked (Hilo C — menor prioridad)

**Autorizado** entrar en cola tras gate Fase 3. Cada ítem = gate + ADR + entrada aquí.

| Prioridad | Tema | Doc |
|-----------|------|-----|
| 1 | Crop editable en más vistas (C3) | ADR 0016 |
| 2 | Workplanes / paradigmas de edición | [`workplanes-roadmap.md`](workplanes-roadmap.md) |
| 3 | OpenCascade / kernel CAD | ADR 0013 |
| 4 | IFC operativo | ADR 0003 |
| 5 | IndexedDB / OPFS / PWA | technical-audit §No introducir |
| 6 | Colaboración multiusuario | — |
| 7 | Nuevos tipos de elemento, familias, más Playwright, desktop no portado | gate + ADR cada uno |

**No empezar** ninguno sin autorización explícita en chat.

---

## Qué está cerrado (referencia rápida)

| Área | Cierre | Dónde |
|------|--------|-------|
| F5-S, F8, ADR 0014–0016 | 2026-08-07/08 | gates, playwright-f8 |
| Auditoría control P1–P5 | 2026-08-08 | technical-audit serie D |
| CI siete pasos + `check:history` | 2026-08-08 | github.md |
| Desacople session (Fase 1) | 2026-08-08 | refactor-session-viewer.md |
| Desacople viewer (Fase 2) | 2026-08-08 | refactor-session-viewer.md |
| Contract tests picking/crop (Fase 3) | 2026-08-08 | viewportUserData.test.ts |
| R1 decisión refactor | 2026-08-08 | desacople real (no microcortes) |

---

## CI vigente

Cada push a `main`:

1. `pnpm check:history` (solo push a main)
2. `pnpm check:shortcuts` → `check:docs` → `check:layers`
3. `pnpm typecheck` → `lint` → `test` → `build`

Workflow aparte: `pnpm test:e2e` (Playwright F8).

---

## Próximo paso recomendado

1. Ejecutar `scripts/setup-github-protection.sh` (repo público + branch protection).
2. Elegir el primer ítem de **Fase 4** con gate explícito.
