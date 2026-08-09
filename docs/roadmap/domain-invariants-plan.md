# Plan — estabilización de integridad del documento (F9-E)

Ejecución de [ADR 0017](../decisions/0017-domain-invariants-in-commands.md), alineado con
los bloques S1–S6 de la [auditoría externa 2026-08-08](../validation/external-audit-2026-08-08.md).

Estado global: **propuesto**. **Ninguna fase autorizada** (2026-08-08).
Cada fase es un gate: se termina, se reporta, se espera autorización explícita en chat
(ADR 0006, regla `10-agent-behavior` §4).

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
| **F9-E1** Contrato de validez | S1 | alto | Opus |
| **F9-E2** Huecos hospedados | S2 | alto | Opus |
| **F9-E3** Catálogo de familias | S3 | alto (decisión de producto) | Opus |
| **F9-E4** Cámaras y sesión | S4 | medio (decisión de producto) | Opus |
| **F9-E5** Frontera `.axon` | S5 | alto (cambia comportamiento visible) | Opus |
| **F9-E6** Docs y guardias | S6 | bajo | Composer |

---

## F9-E1 — contrato de validez único

Predicados puros en `packages/model`: `validateWall`, `validateDoor`, `validateWindow`,
`validateCamera`, `validateHostedOpening`. Mínimos reales (`MIN_WALL_LENGTH`, espesor,
altura), finitud (`NaN`/`Infinity` rechazados), referencias (`storeyId`, `familyId`), enums
(`hinge`, `swing`, `leafState`), rangos de cámara (FOV, `eye ≠ target`).

Resultado estructurado de `Command` separando no-op de rechazo. `HistoryStack` apila solo
`changed: true`. `documentMutation.ts` deja de convertir todo `false` en «Sin cambios» y
muestra el motivo real.

**Hecho cuando:** tests negativos por invariante (altura `0.049`, `0`, negativa, `NaN`,
`Infinity`; espesor equivalente; refs inexistentes), test de que un comando rechazado **no
limpia el redo**, `pnpm test` y `pnpm typecheck` limpios.

**Gate E1:** ningún comando público puede dejar `AxonDocument` inválido según el contrato
documentado. Revisión humana en la app: los mensajes de error deben ser mejores que antes,
no peores.

---

## F9-E2 — huecos hospedados

Una sola función de intervalos hospedados, usada por `CreateDoorCommand`,
`CreateWindowCommand`, `SetDoorFamilyCommand`, `SetWindowFamilyCommand` y el parser.

Cierra el bug presente: colocar puerta solo comprueba solape contra puertas
(`sketchToolSlice.ts:253`), así que **ventana → puerta solapa hoy**. Igual al cambiar de
familia (`selectionSlice.ts:275`).

`packages/geometry` declara su precondición (huecos válidos y sin solape) con aserción
defensiva o test, en vez de recortar en silencio (`openings.ts:87-94`).

**Hecho cuando:** tests cruzados puerta↔puerta, puerta↔ventana **en los dos órdenes**,
ventana↔ventana, cambio de familia que introduce solape, extremos de muro, `sill + height`
incompatible. Test de `wallMeshWithOpenings` con varios huecos válidos.

**Gate E2:** el orden puerta→ventana y ventana→puerta produce el mismo resultado de
validación. Revisión humana colocando huecos en la app.

---

## F9-E3 — catálogo de familias

**Requiere decisión del dueño antes de implementar** (ADR 0017 §«Decisiones que este ADR no
puede tomar solo»):

- **A** — catálogos del documento son reales: UI, herramientas y comandos consumen
  `document.families` / `doorFamilies` / `windowFamilies`; al cargar se reconcilian los IDs
  activos. Es lo que espera un BIM.
- **B** — v1 declara catálogo fijo de built-ins: `parseDocument` deja de aceptar catálogos
  arbitrarios y el formato documenta la limitación. Más restrictivo, más honesto a corto.

Elegida una, se elimina el híbrido. Hoy `parseDocument` acepta `data.families`
(`persistence/src/index.ts:171`) mientras `PropertiesPanel` solo pinta `BUILTIN_*`
(`:213,295,373`), y ningún comando valida contra el catálogo del documento.

**Hecho cuando:** abrir documento con catálogo propio → el selector muestra ese catálogo (A)
o el archivo se rechaza con mensaje claro (B); dibujar → la entidad referencia una familia
existente en el documento; roundtrip exportar/reabrir válido; cargar documento sin el
`activeFamilyId` previo → la sesión elige una familia válida de forma determinista.

**Gate E3:** cualquier documento que abre correctamente puede editarse y exportarse sin
introducir referencias de familia inválidas por los flujos normales.

---

## F9-E4 — cámaras y sesión

**Requiere decisión del dueño**: derivar las entradas de cámara del documento (A) o
mantener `ProjectView` en sesión con `reconcileViewsWithDocument(doc, views)` llamada tras
create/delete/rename/undo/redo/import/new/demo (B). (A) reduce invariantes cruzadas.

Incluye `resetSessionForDocument(document)` como transición única de proyecto, usada por
`newProject`, `openDemo` y `openFromText`: reconciliar familias activas, reconstruir vistas,
elegir vista activa determinista, limpiar selecciones, limpiar drag/preview/crop vivos,
sincronizar secuencias de ID, historial nuevo. Hoy `openFromText`
(`projectSlice.ts:68-86`) no hace ninguna de esas cosas.

Incluye `touchDoc` clonando `cameras` (`touchDoc.ts:7-18` las omite hoy) con test que cubra
todas las colecciones, no solo `walls`/`meta`.

**Hecho cuando:** tests de crear → undo → sin vista huérfana; redo → vista recuperada;
borrar → undo → vista recuperada; renombrar → undo → nombre consistente; abrir archivo A
tras archivo B con cámaras → sin referencias de B; importar cámara → aparece navegable.
E2E comprueba la pestaña, no solo el contador.

**Gate E4:** `document.cameras` y `session.views(kind=camera)` no pueden contradecirse
después de ninguna acción pública.

---

## F9-E5 — frontera `.axon`

`JSON.parse` a `unknown`, validación de forma antes de castear, validación semántica con los
predicados de E1, IDs y enums, errores siempre controlados (`Invalid .axon file: ...`),
límites razonables de tamaño y número de entidades.

**Decisión de producto pendiente**: un `.axon` con huecos solapados hoy abre; después de
esta fase, no. ¿Rechazo duro del archivo, o apertura con informe de entidades descartadas?
El rechazo duro es hostil si el usuario no tiene otra copia. También hay que decidir si la
normalización silenciosa de crop al importar (`index.ts:198`) sigue siendo política
deliberada de migración.

**Hecho cuando:** fixtures malformados (array que llega como objeto, IDs repetidos, refs
inexistentes, enums inválidos, números no finitos, cámara sin `eye`/`target`) fallan de
forma controlada; fixtures válidos actuales intactos; roundtrip aceptado → aceptado.

**Gate E5:** toda entrada inválida se rechaza de forma controlada y ninguna entrada
aceptada viola los invariantes del modelo. Nota de producto en `pending-work.md`.

---

## F9-E6 — documentación y guardias

1. `commands-and-history.md` al contrato real (hoy documenta `execute(doc): void` y
   `push(cmd): void`, que no existen) y luego al resultado estructurado de E1.
2. `overview.md`: responsabilidad de validación materializada en `model`.
3. README: quita «stub» de Commands y Geometry, actualiza el estado real.
4. `geometry-policy.md`: distinguir MVP histórico de extensiones ya aprobadas por ADR.
5. `check:links` como guardia separada (`check:docs` verifica alcanzabilidad, no resuelve
   enlaces; por eso el enlace roto de `CHANGELOG.md:55` pasaba).
6. Matriz de aceptación post-MVP: por feature, contrato funcional, invariante de dominio,
   evidencia automatizada, validación manual, comportamiento undo/redo, roundtrip.

**Gate E6:** documentación operativa y código describen el mismo contrato en la fecha de
cierre.

---

## Contraste con la auditoría externa

Verificación independiente de sus hallazgos, hecha leyendo el código el 2026-08-08:

| Hallazgo | Verificado | Nota |
|---|---|---|
| AX-P0-01 comandos no garantizan invariantes | **sí** | `doors.ts:22` confirma |
| AX-P0-02 catálogos híbridos | **sí** | `persistence:171` vs `PropertiesPanel:213` |
| AX-P1-03 parser incompleto / cast inseguro | **sí** | `persistence:161` es cast |
| AX-P1-04 solape asimétrico | **sí** | `sketchToolSlice:253` solo puertas |
| AX-P1-05 cámaras doble verdad | **sí** | `selectionSlice:155,169` fuera del comando |
| AX-P1-06 `openFromText` no reconcilia | **sí** | `projectSlice:68-86` |
| AX-P2-07 `touchDoc` sin cameras | **sí** | `touchDoc.ts:7-18` |
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
workplanes ni modos de edición. No añade tests indiscriminados: solo los que rompen los
invariantes encontrados.
