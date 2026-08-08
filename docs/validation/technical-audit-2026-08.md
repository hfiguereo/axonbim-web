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

## No introducir en esta fase

OCCT · IFC operativo · IndexedDB/OPFS/PWA · colaboración · migrar todo a UUID.

Plan de corrección original: [`f5-stabilization.md`](../roadmap/f5-stabilization.md).
Refactor en curso: [`refactor-session-viewer.md`](../roadmap/refactor-session-viewer.md).
