# Auditoría técnica (extracto operativo)

Consolidado 2026-08-07. **Reverificado contra el código 2026-08-08** (alineación autorizada por el dueño).

Antes de esa reverificación este documento describía A1, A3 y A4 como hallazgos abiertos
cuando ya estaban corregidos, y anunciaba Playwright como cola pendiente cuando ya estaba
aprobado. Se corrige y se anota abajo como hallazgo de proceso (C1).

## Conclusión

Arquitectura alineada (documento SoT, comandos, geometría, React, Three).
**F5-S aprobado** (2026-08-07). **F8 Playwright o1 + o2 + CI aprobados** (2026-08-08).
De la serie A, **A1–A4 cerrados** (A4 vía F9-E5, 2026-08-09). Deuda estructural B5
(`sessionStore` / `createViewport`): **cerrada** 2026-08-08 tras desacople real (Fases 1–2).
Protección remota A1/D5: **cerrada** 2026-08-08 (repo público + branch protection).

**Revisión 2026-08-08 (tarde):** una [auditoría externa](external-audit-2026-08-08.md)
encargada por el dueño desmintió varias afirmaciones de este documento y encontró seis
hallazgos P0/P1 de integridad de datos que esta auditoría no vio. Corregido abajo. Respuesta
del proyecto: [ADR 0017](../decisions/0017-domain-invariants-in-commands.md) +
[`domain-invariants-plan.md`](../roadmap/domain-invariants-plan.md).

El código está en mejor estado que el **sistema de control** que lo vigila: la serie D
(2026-08-08) encuentra que varias reglas no tenían nada que las comprobara. Pendientes
consolidados al final de la serie D.

## Hallazgos A (auditoría original)

| ID | Tema | Sev. | Estado | Evidencia en código (2026-08-08) |
|----|------|------|--------|----------------------------------|
| A1 | Colisión de IDs tras importar | P0 | **cerrado con matiz** | `syncIdSequencesFromDocument` se llama en `newProject`, `openDemo` y `openFromText` (`apps/web/src/session/projectSlice.ts:25,47,71`). Matiz: depende de que la UI lo recuerde, y `maxNumericSuffix` ignora IDs no numéricos como `wall.demo.N`. Contrato de IDs ambiguo → ADR 0017 |
| A2 | Undo de muro sin hospedados | P0 | **cerrado** | `DeleteWallCommand` guarda `doorSnapshots` + `windowSnapshots` y los restaura (`packages/commands/src/walls.ts`) |
| A3 | No-ops en historial | P1 | **cerrado** | `HistoryStack.push` sale con `false` **antes** de apilar y antes de limpiar rehacer (`packages/commands/src/history.ts`) |
| A4 | Validación `.axon` incompleta | P1 | **cerrado** 2026-08-09 (F9-E5) | Híbrido A3: `parseDocument` estricto + `parseDocumentRecover`; checklist humana OK |

**Lección de A4:** cerrar un hallazgo porque se corrigió *parte* de él es peor que dejarlo
abierto, porque desactiva la vigilancia. Un hallazgo se cierra cuando el contrato completo
que lo definió está cubierto, o se reformula explícitamente a un alcance menor.

## Hallazgos B (detectados en el refactor controlado, cortes 4–7c)

Ninguno era visible con pruebas funcionales: el comportamiento observable era correcto.

| ID | Tema | Estado |
|----|------|--------|
| B1 | La fórmula de world-per-pixel estaba duplicada **6 veces** en `createViewport` | **cerrado** — corte 7b, `packages/viewer/src/pickTolerance.ts` |
| B2 | Umbrales de proximidad de clic documentados (entidad/grip 14 px, marco/flip 16 px) | **cerrado (MVP)** — `pickTolerance.ts`; decisión C1 |
| B3 | Código muerto en `pickCropGrip` (`const wpp = …; void wpp;`) | **cerrado** — corte 7b |
| B4 | El invariante de historial de F5-S no tenía prueba en el camino que usa la UI (solo dentro de `@axonbim/commands`) | **cerrado** — corte 7c, `apps/web/src/session/documentMutation.test.ts` |
| B5 | Monolitos `sessionStore` / `createViewport` | **cerrado** — desacople real 2026-08-08; compositor session ~13 líneas, viewer ~223 líneas; ver [`refactor-session-viewer.md`](../roadmap/refactor-session-viewer.md) |
| B6 | CI solo ejecutaba Playwright: «typecheck y tests verdes» nunca se verificaba de forma independiente | **cerrado** — `.github/workflows/ci.yml` (2026-08-08) |
| B7 | `packages/model` (matemática de crop del ADR 0016, SoT) tenía **0 tests** bajo `--passWithNoTests`; `families` y `shared` sin script de test | **cerrado** — 2026-08-08; 60 → **104** tests (`pnpm test`), 9/9 paquetes cubiertos |
| B8 | Los invariantes del documento dependen de la UI: los comandos no los defienden | **abierto** — ADR 0017; ver serie AX abajo |

## Hallazgos C (proceso)

| ID | Tema | Estado |
|----|------|--------|
| C1 | Este documento quedó desactualizado tras F5-S y F8: describía defectos ya corregidos como vigentes | **cerrado** hoy. Regla práctica: al cerrar un gate, reverificar los hallazgos contra el código, no solo añadir una línea de estado |

## Hallazgos D — auditoría del sistema de control (2026-08-08)

Pedido del dueño: comprobar si las reglas se **verifican** o solo se **declaran**. Una
regla que nadie comprueba es un placebo: da la sensación de control sin darlo.

Criterio usado: para cada regla, ¿existe algo que **falle** si se incumple? Los huecos
marcados «verificado en negativo» se comprobaron incumpliéndolos a propósito.

| ID | Regla que dice… | ¿Se comprueba? | Sev. | Estado |
|----|-----------------|----------------|------|--------|
| D1 | `10-agent-behavior` §10: doc permanente nueva → **actualizar el índice de `AGENTS.md`** | **No.** Y ya estaba incumplida: `plan-maestro-axonbim-web.pdf` (plan maestro, v1.0, 649 KB) y su `plan-maestro-resumen.md` no aparecían en el índice, así que ningún agente los leía | **P1** | **cerrado** — índice corregido y `pnpm check:docs` en CI |
| D2 | `00-architecture` §5: dominio sin React / Three / DOM / almacenamiento | **No.** Hoy el dominio está limpio (verificado a mano en los 7 paquetes), pero nada impide que el próximo agente importe `three` en `packages/geometry` | **P1** | **cerrado** — `pnpm check:layers` en CI |
| D3 | `pnpm typecheck` cubre el repo | **No.** Ningún `tsconfig` incluye `e2e/`. Verificado en negativo: `const roto: number = "…"` en `e2e/smoke.spec.ts` dejaba `typecheck` en **exit 0**. Los specs de Playwright solo fallaban en ejecución | **P1** | **cerrado** — `tsconfig.e2e.json`; el mismo error ahora da exit 2 |
| D4 | CI valida lo que se entrega | **Parcial.** `pnpm build` no está en CI: un build de producción roto puede entrar en `main` y solo se detecta a mano (`typecheck` no es build) | **P2** | **cerrado** — paso `Production build` en `ci.yml` |
| D9 | El índice de ADR (`docs/decisions/README.md`) no listaba el **ADR 0009**: existía pero solo lo citaba `interface-base.md`. Lo destapó el guardia de D1 al exigir alcanzabilidad | **P2** | **cerrado** — 2026-08-08 |
| D5 | `40-git-and-scope`: solo `main`, sin sync destructivo | Antes **no se podía**: repo privado en plan gratuito, la API de protección respondía `403 Upgrade to GitHub Pro` | **P2** | **cerrado** 2026-08-08 — repo público + branch protection (sin force-push, sin borrado, `enforce_admins`) + `check:history` en CI; ver [`github.md`](../roadmap/github.md) |
| D6 | `plan-maestro-resumen.md` describe el estado del repo | **Contenido obsoleto:** afirmaba «el código empieza solo tras autorización post-gate F1» cuando F1, MVP, F5-S y F8 ya están cerrados | **P2** | **anotado** hoy con nota fechada |
| D7 | `30-testing-validation` §3: no debilitar pruebas | **Sí**, desde hoy: `pnpm check:shortcuts`, verificado en negativo | — | **cerrado** |
| D8 | Secretos fuera del repo | **Sí, razonable:** `.gitignore` cubre `.env*`, y no hay `.env`, clave ni credencial rastreada | — | **cerrado** |

Lo que **sí** está sólido y conviene no tocar: `strict: true` con `noUnusedLocals` /
`noUnusedParameters` / `noFallthroughCasesInSwitch` en `tsconfig.base.json`; `forbidOnly`
en CI para Playwright; los 9 paquetes con script de test real; y ningún test con más tests
que aserciones.

**Corrección 2026-08-08:** este documento afirmaba «ningún enlace relativo roto». La
auditoría externa encontró **uno** (`CHANGELOG.md:55` apuntaba a `pending-work.md` desde la
raíz; el archivo está en `docs/roadmap/`). Corregido. `check:docs` no lo detectaba porque
comprueba alcanzabilidad por nombre, no resolución de enlaces: falta `check:links` (fase
**F9-E6**). Es el mismo error de razonamiento que A4: confundir «el guardia pasa» con «la
propiedad se cumple».

## Hallazgos AX — auditoría externa (2026-08-08)

Documento completo: [`external-audit-2026-08-08.md`](external-audit-2026-08-08.md).
Verificación independiente de cada hallazgo y plan por fases:
[`domain-invariants-plan.md`](../roadmap/domain-invariants-plan.md).

Su veredicto: base arquitectónica **aprobada y conservable**; integridad del modelo y
frontera `.axon` **no aprobadas** para ampliar features. Coincide con la conclusión de
arriba pero al revés de como lo contábamos: el problema no es que el código esté peor que
su sistema de control, es que **el dominio declara reglas más estrictas de las que hace
cumplir**.

| ID | Hallazgo | Sev. | Verificado | Fase |
|----|----------|------|-----------|------|
| AX-P0-01 | Los comandos no garantizan invariantes | P0 | sí | F9-E1 |
| AX-P0-02 | Catálogos de familias híbridos corrompen el roundtrip | P0 | sí | F9-E3 |
| AX-P1-03 | Parser `.axon` incompleto y forma no validada | P1 | sí | F9-E5 |
| AX-P1-04 | Solape puerta↔ventana asimétrico (**bug presente**) | P1 | sí | F9-E2 |
| AX-P1-05 | Cámaras con doble fuente de verdad; undo no transaccional | P1 | sí | F9-E4 |
| AX-P1-06 | `openFromText` no reconcilia sesión ni cámaras | P1 | sí | F9-E4 |
| AX-P2-07 | `touchDoc` no clona `cameras` | P2 | sí | F9-E4 |
| AX-P2-08 | `boolean` de `Command` mezcla no-op y rechazo | P2 habilitador | sí | F9-E1 |
| AX-P2-09 | Contrato de IDs divergente entre doc e implementación | P2 | sí | F9-E1 |
| AX-P2-10 | Doble política de tolerancia (mm en geometría vs `EPS_LENGTH`) | P2 | sí | anotado |
| AX-P2-11 | Scene sync reconstruye todo | P2 | sí (deuda, no bug) | no ahora |
| AX-P2-12 | Los tests no cubren los riesgos principales | P2 | sí | transversal |
| DOC-01…10 | Deriva documental | P2 | sí | F9-E6 |
| SEC-01…04 | Hardening de importación y red | P3 | sí | no ahora |

Único matiz a su informe: el recuento de tests. Dice 101 (estático); `pnpm test` ejecuta
**104**. Su limitación declarada es real y honesta: auditó sin `node_modules`, así que no
ejecutó `typecheck`, `lint`, `test`, `build` ni Playwright, y lo dice explícitamente en vez
de dar por buenas nuestras afirmaciones de CI.

### Pendientes vivos (no perder el hilo)

**Lista maestra ordenada por prioridad:** [`pending-work.md`](../roadmap/pending-work.md).

Resumen 2026-08-08:

| # | Pendiente | Hilo | Estado |
|---|-----------|------|--------|
| P1–P5 | Guardias + lint + build + e2e typecheck | A — Control | **hecho** |
| **F9-E** | **Estabilización de integridad (AX-P0/P1)** | B — Dominio | **propuesta · espera dueño · bloquea Fase 4** |
| A4 | Frontera `.axon` completa | B — Dominio | **cerrado** (F9-E5, 2026-08-09) |
| R1 | Objetivo del refactor | B — Refactor | **resuelto** — desacople real, Fases 1–3 cerradas |
| B5 / P6 | Monolitos `sessionStore` / `createViewport` | B — Refactor | **cerrado** 2026-08-08 |
| P7 / C1 | Umbrales de clic unificados | C — Producto | **cerrado (MVP)** |
| P8 / A1 / D5 | Protección de rama GitHub | A — Proceso | **cerrado** 2026-08-08 |
| P9 / C2 | Bundle ~834 kB | C — Producto | **cerrado (MVP)** |
| 7d+ | Cortes triviales viewer | B — Refactor | **sustituido** por el desacople real |
| Parked | OCCT, IFC, Sketch/Edit (WP-v1 ya cerrado), PWA… | C — Producto | gate no abierto |

### Lo que estos controles **no** atrapan

Conviene tenerlo claro para no confundir CI verde con corrección. Los guardias
detectan atajos y descuidos mecánicos. **No** detectan un test que pasa pero no
comprueba lo que su nombre afirma, ni una implementación que cumple los tipos y falla
el propósito. Contra eso solo funciona pedir la evidencia y **verificar en negativo**:
romper a propósito lo que el control dice vigilar y comprobar que falla. Todos los
guardias de hoy (D1, D2, D3, D7) se validaron así.

## No introducir en esta fase

OCCT · IFC operativo · IndexedDB/OPFS/PWA · colaboración · migrar todo a UUID.

Plan de corrección original: [`f5-stabilization.md`](../roadmap/f5-stabilization.md).
Refactor (pausado): [`refactor-session-viewer.md`](../roadmap/refactor-session-viewer.md).
**Pendientes ordenados:** [`pending-work.md`](../roadmap/pending-work.md).
