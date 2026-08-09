# Plan — estabilización de integridad del documento (F9-E)

Ejecución de [ADR 0017](../decisions/0017-domain-invariants-in-commands.md), alineado con
los bloques S1–S6 de la [auditoría externa 2026-08-08](../validation/external-audit-2026-08-08.md).

Estado global: **F9-E cerrada** — E1–E6 cerradas (2026-08-09).
Cada fase fue un gate (ADR 0006, regla `10-agent-behavior` §4).

**Bloquea Fase 4.** La auditoría externa recomienda no abrir expansión funcional antes de
cerrar P0/P1, y la razón es sólida: cada herramienta nueva que emita comandos vuelve a
reimplementar las reglas en la UI, con lo que el problema crece en vez de cerrarse.

## Orden y por qué

El orden es por **dónde duele**, no por tamaño. Primero el contrato de validez, porque sin
distinguir no-op de rechazo no se puede informar al usuario de nada de lo que viene después.
Luego los huecos hospedados, que tienen un bug de producto presente. Después catálogos y
cámaras, cada uno con una decisión de producto pendiente. La frontera `.axon` va después de
tener los predicados, porque debe consumirlos en vez de duplicarlos. Rendimiento y hardening
no entran: no son este problema.

| Fase | Bloque auditoría | Riesgo | Herramienta |
|------|------------------|--------|-------------|
| **F9-E1** Contrato de validez | S1 | alto | **cerrada** 2026-08-09 |
| **F9-E2** Huecos hospedados | S2 | alto | **cerrada** 2026-08-09 |
| **F9-E3** Catálogo de familias | S3 | alto | **cerrada** · política **A** |
| **F9-E4** Cámaras y sesión | S4 | medio | **cerrada** · política **A** |
| **F9-E5** Frontera `.axon` | S5 | alto | **cerrada** · híbrido **A3** |
| **F9-E6** Docs y guardias | S6 | bajo | **cerrada** |

---

## F9-E1 — contrato de validez único · **cerrada** (2026-08-09)

Predicados puros en `packages/model/src/validate.ts`: `validateWall`, `validateDoor`,
`validateWindow`, `validateCamera`, `validateViewCrop`. Mínimos (`MIN_WALL_LENGTH`, espesor,
altura), finitud, referencias (`storeyId`, `familyId`), enums (`hinge`, `swing`,
`leafState`), rangos de cámara (FOV 10–120, eye≠target). Fit/solape de huecos **no** entra
aquí → E2 (`validateHostedOpening`).

`CommandResult` en `packages/commands/src/types.ts` separa no-op de rechazo. `HistoryStack`
apila solo `changed: true`. `documentMutation` muestra motivo en español (o mensaje técnico
si el código no está mapeado). Persistencia reutiliza los mismos predicados.

**Cierre:** typecheck/lint/test/build/e2e verdes; verificación humana del dueño; contrato
documentado en `commands-and-history.md`.

---

## F9-E2 — huecos hospedados · **cerrada** (2026-08-09)

`packages/model/src/openingFit.ts`: `validateHostedOpening` (márgenes de extremo, cabida
vertical, solape con gap). Usada por `CreateDoor`/`CreateWindow`/`Set*Family`, parser
`.axon`, y la UI (`sketchToolSlice` / `selectionSlice`) para el mensaje.

Cierra AX-P1-04: puerta y ventana se comprueban entre sí en **ambos** órdenes. Geometría
documenta la precondición en `wallMeshWithOpenings`.

**Cierre:** automatizado verde + checklist humana del dueño («E2 checklist OK»).

---

## F9-E3 — catálogo de familias · **cerrada** (política A, 2026-08-09)

**Decisión:** A — catálogos del documento son la fuente de verdad. Built-ins solo siembran
new/demo (`@axonbim/families`).

- `packages/model/src/catalog.ts`: `find*Family`, `reconcileActiveFamilyIds`
- UI (`PropertiesPanel`) y tools (`sketchToolSlice` / `selectionSlice`) leen
  `document.*Families`; sin `??` de dimensiones inventadas
- `newProject` / `openDemo` / `openFromText` reconcilian IDs activos
- Roundtrip con catálogo custom en tests de persistencia

**Cierre:** automatizado verde + checklist humana («E3 checklist OK»).

---

## F9-E4 — cámaras y sesión · **cerrada** (política A, 2026-08-09)

**Decisión:** A — las pestañas `kind=camera` se **derivan** de `document.cameras` tras
cada mutación/undo/redo/import. Planta y perspectiva libre siguen siendo de sesión.

- `apps/web/src/session/cameraViews.ts`: `mergeViewsWithDocument` / `patchViewsAfterDocumentChange`
- `applyCommand` + `runUndo` / `runRedo` reconcilian vistas; create/delete/rename ya no
  mutan `views` a mano
- `resetSessionForDocument` unifica `newProject` / `openDemo` / `openFromText`
- `touchDoc` clona `cameras` (antes omitido)

**Cierre:** automatizado verde + checklist humana del dueño («E4 checklist OK»).

---

## F9-E5 — frontera `.axon` · **cerrada** (híbrido A3, 2026-08-09)

**Decisión:** A3 — Abrir `.axon` = rechazo duro (A); **Recuperar copia…** / `.axon.bak` =
salvamento con informe (B). Exportar solo escribe `.axon` limpio. Crop: válido tal cual
en A; en B se puede reparar con aviso. Crops de planta/perspectiva **activados** persisten
en `presentation.viewCrops` (ADR 0016 rev. persistencia).

- `packages/persistence/src/shape.ts` + `parse.ts`: JSON→`unknown`, forma, caps, IDs globales
- `parseDocument` / `parseDocumentRecover`; UI: Abrir vs Recuperar copia…
- Predicados E1/E2 compartidos; sin defaults ni `normalizeViewCrop` en strict

**Cierre:** automatizado verde + checklist humana del dueño («E5 checklist OK»).

---

## F9-E6 — documentación y guardias · **cerrada** (2026-08-09)

1. `commands-and-history.md` → `CommandResult` / historial real (DOC-01).
2. `overview.md` → validación en `model`; persistence = frontera `.axon` (DOC-02).
3. README → sin «stub»; estado F9-E / ADR 0014–0016 (DOC-07).
4. `geometry-policy.md` → huecos ADR 0010/0011; parked explícito (DOC-08).
5. `pnpm check:links` + paso en CI (`scripts/check-markdown-links.mjs`) (DOC-06).
6. Matriz post-MVP: [`acceptance-matrix-post-mvp.md`](../validation/acceptance-matrix-post-mvp.md) (DOC-09).

**Cierre:** `check:docs` + `check:links` verdes; checklist humana («E6 checklist OK»).

**F9-E completa.** La estabilización de integridad (auditoría externa P0/P1 + docs) está cerrada.

---

## Contraste con la auditoría externa

Verificación independiente de sus hallazgos, hecha leyendo el código el 2026-08-08:

| Hallazgo | Verificado | Nota |
|---|---|---|
| AX-P0-01 comandos no garantizan invariantes | **sí** | `doors.ts:22` confirma |
| AX-P0-02 catálogos híbridos | **sí** | `persistence:171` vs `PropertiesPanel:213` |
| AX-P1-03 parser incompleto / cast inseguro | **sí (E5)** | shape + strict/recover A3 |
| AX-P1-04 solape asimétrico | **sí** | `sketchToolSlice:253` solo puertas |
| AX-P1-05 cámaras doble verdad | **sí (E4)** | tabs derivadas; sin mutar `views` a mano |
| AX-P1-06 `openFromText` no reconcilia | **sí (E4)** | `resetSessionForDocument` |
| AX-P2-07 `touchDoc` sin cameras | **sí (E4)** | `touchDoc` clona `cameras` |
| AX-P2-08 `boolean` insuficiente | **sí** | `documentMutation.ts:35-38` |
| AX-P2-10 doble tolerancia geométrica | **sí** | `wallBox.ts:37-39` redondeo a mm |
| DOC-01 contrato documentado obsoleto | **sí** | `commands-and-history.md:9,24` |
| DOC-06 enlace roto | **sí** | `CHANGELOG.md:55` |
| DOC-05 recuento de tests | **matizado** | `pnpm test` da **104**; el doc decía 99, la auditoría contó 101 estáticamente |
| §3.2 la UI no muta el documento | **sí** | coincide con auditoría interna |

Su limitación declarada es real y honesta: auditó sin `node_modules`, así que no ejecutó
`typecheck`, `lint`, `test`, `build` ni Playwright. Los recuentos de tests son estáticos.

## Lo que este plan no hace

No refactoriza el store. No migra a UUID por estética. No introduce OCCT, IndexedDB, OPFS
ni workers. No optimiza el scene sync (AX-P2-11 es deuda de escalabilidad: medir antes de
tocar). No mueve validación de vuelta a la UI. No mezcla esta estabilización con
Sketch/Edit Mode (WP-v1 Workplane quedó fuera de F9-E a propósito). No añade tests
indiscriminados: solo los que rompen los invariantes encontrados.
