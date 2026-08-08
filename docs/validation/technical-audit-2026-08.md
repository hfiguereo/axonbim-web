# Auditoría técnica (extracto operativo)

Consolidado 2026-08-07. **Reverificado contra el código 2026-08-08** (alineación autorizada por el dueño).

Antes de esa reverificación este documento describía A1, A3 y A4 como hallazgos abiertos
cuando ya estaban corregidos, y anunciaba Playwright como cola pendiente cuando ya estaba
aprobado. Se corrige y se anota abajo como hallazgo de proceso (C1).

## Conclusión

Arquitectura alineada (documento SoT, comandos, geometría, React, Three).
**F5-S aprobado** (2026-08-07). **F8 Playwright o1 + o2 + CI aprobados** (2026-08-08).
Los cuatro hallazgos de la serie A están **cerrados y verificados en el código**.
Deuda estructural viva: tamaño de `sessionStore` y `createViewport` (ver B5).

El código está en mejor estado que el **sistema de control** que lo vigila: la serie D
(2026-08-08) encuentra que varias reglas no tenían nada que las comprobara. Pendientes
consolidados al final de la serie D.

## Hallazgos A (auditoría original) — todos cerrados

| ID | Tema | Sev. | Estado | Evidencia en código (2026-08-08) |
|----|------|------|--------|----------------------------------|
| A1 | Colisión de IDs tras importar | P0 | **cerrado** | `syncIdSequencesFromDocument` se llama en `newProject`, `openDemo` y `openFromText` (`apps/web/src/sessionStore.ts`) |
| A2 | Undo de muro sin hospedados | P0 | **cerrado** | `DeleteWallCommand` guarda `doorSnapshots` + `windowSnapshots` y los restaura (`packages/commands/src/walls.ts`) |
| A3 | No-ops en historial | P1 | **cerrado** | `HistoryStack.push` sale con `false` **antes** de apilar y antes de limpiar rehacer (`packages/commands/src/history.ts`) |
| A4 | Validación `.axon` incompleta | P1 | **cerrado** | `validateWall` comprueba `storeyId`/`familyId` y longitud mínima; puertas/ventanas validan familia (`packages/persistence/src/index.ts`) |

## Hallazgos B (detectados en el refactor controlado, cortes 4–7c)

Ninguno era visible con pruebas funcionales: el comportamiento observable era correcto.

| ID | Tema | Estado |
|----|------|--------|
| B1 | La fórmula de world-per-pixel estaba duplicada **6 veces** en `createViewport` | **cerrado** — corte 7b, `packages/viewer/src/pickTolerance.ts` |
| B2 | Umbrales de proximidad de clic no uniformes (entidad 14 px, grip crop 14, marco crop 12, flip 16) sin criterio documentado | **nombrados** en 7b; marco subido a 16 px por decisión del dueño (2026-08-08); el resto sigue sin unificar a propósito |
| B3 | Código muerto en `pickCropGrip` (`const wpp = …; void wpp;`) | **cerrado** — corte 7b |
| B4 | El invariante de historial de F5-S no tenía prueba en el camino que usa la UI (solo dentro de `@axonbim/commands`) | **cerrado** — corte 7c, `apps/web/src/session/documentMutation.test.ts` |
| B5 | `sessionStore` (~1540 líneas) y `createViewport` (~1315) siguen siendo monolitos | **abierto** — los cortes 1–7c solo pelaron crop, tipos, clip, presets, fit, shell e historial |
| B6 | CI solo ejecutaba Playwright: «typecheck y tests verdes» nunca se verificaba de forma independiente | **cerrado** — `.github/workflows/ci.yml` (2026-08-08) |
| B7 | `packages/model` (matemática de crop del ADR 0016, SoT) tenía **0 tests** bajo `--passWithNoTests`; `families` y `shared` sin script de test | **cerrado** — 2026-08-08; 60 → 99 tests, 9/9 paquetes cubiertos |

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
| D5 | `40-git-and-scope`: solo `main`, sin sync destructivo | **No, y no se puede hoy.** El repo es privado en plan gratuito: la API de protección de ramas responde `403 Upgrade to GitHub Pro`. La regla depende **por completo** de la obediencia del agente. Único respaldo real: solo existe `main` en el remoto | **P2** | **abierto por límite de plataforma** |
| D6 | `plan-maestro-resumen.md` describe el estado del repo | **Contenido obsoleto:** afirmaba «el código empieza solo tras autorización post-gate F1» cuando F1, MVP, F5-S y F8 ya están cerrados | **P2** | **anotado** hoy con nota fechada |
| D7 | `30-testing-validation` §3: no debilitar pruebas | **Sí**, desde hoy: `pnpm check:shortcuts`, verificado en negativo | — | **cerrado** |
| D8 | Secretos fuera del repo | **Sí, razonable:** `.gitignore` cubre `.env*`, y no hay `.env`, clave ni credencial rastreada | — | **cerrado** |

Lo que **sí** está sólido y conviene no tocar: `strict: true` con `noUnusedLocals` /
`noUnusedParameters` / `noFallthroughCasesInSwitch` en `tsconfig.base.json`; `forbidOnly`
en CI para Playwright; los 9 paquetes con script de test real; ningún enlace relativo roto
en los 47 documentos; y ningún test con más tests que aserciones.

### Pendientes vivos (no perder el hilo)

| # | Pendiente | Origen | Estado |
|---|-----------|--------|--------|
| P1 | Meter `e2e/` en el typecheck | D3 | **hecho** 2026-08-08 |
| P2 | Comprobación automática del índice de `AGENTS.md` | D1 | **hecho** 2026-08-08 |
| P3 | Comprobación automática de pureza del dominio | D2 | **hecho** 2026-08-08 |
| P4 | `pnpm build` en CI | D4 | **hecho** 2026-08-08 |
| P5 | ESLint real + `pnpm lint` en CI (hoy `lint` no ejecuta nada) | D-vecino | **abierto**, sin autorizar |
| P6 | Seguir pelando `sessionStore` / `createViewport` (cortes 7d+) | B5 | **abierto**, sin autorizar |
| P7 | Unificar umbrales de proximidad de clic con criterio documentado | B2 | **abierto**, requiere decisión de producto |
| P8 | Protección de rama en GitHub | D5 | **abierto**, requiere plan Pro o repo público |
| P9 | Bundle de producción en 834 kB (aviso de Vite por >500 kB); nadie ha decidido si importa | observado al añadir P4 | **abierto**, sin autorizar |

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
Refactor en curso: [`refactor-session-viewer.md`](../roadmap/refactor-session-viewer.md).
