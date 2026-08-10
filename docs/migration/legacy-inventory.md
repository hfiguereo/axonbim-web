# Inventario legado — AxonBIM desktop → Web

Fuente de matriz inicial: Plan Maestro §31. Legado de referencia: `axonBIM-develop` (zip; fuera de este repo).

Línea LR (integración selectiva):
[`plan-integracion-selectiva-resumen.md`](plan-integracion-selectiva-resumen.md) +
[`../roadmap/legacy-reuse-roadmap.md`](../roadmap/legacy-reuse-roadmap.md).

El inventario es **documentación de consulta**, no fuente de código para copiar.

## Clasificación LR (plan de integración selectiva)

| Pieza | Bloque | Clasificación LR | Decisión inventario |
|-------|--------|------------------|---------------------|
| Snap con histéresis / SnapSession | LR1 (**cerrada**) | CONSERVAR COMO REFERENCIA (Desktop) | REESCRIBIR — hecho en Web 2026-08-09 |
| Midpoint / perpendicular / proyecciones | LR1-C | REIMPLEMENTAR CUANDO SE ABRA SU FASE | APLAZAR — doc en roadmap §LR1-C |
| Restart Chain | LR1-B (**cerrada**) | CONSERVAR COMO REFERENCIA | REESCRIBIR — hecho 2026-08-09 |
| Command Transactions / Composite | LR2 (**cerrada**) | CONSERVAR COMO REFERENCIA | REESCRIBIR — `CompositeCommand` 2026-08-09 |
| Active Storey | LR3-A (**cerrada**) | CONSERVAR COMO REFERENCIA | REESCRIBIR — hecho 2026-08-09 |
| Storey Datums | LR3-B (**cerrada**) | CONSERVAR COMO REFERENCIA | REESCRIBIR (derivado) — hecho |
| Model Envelope | LR3-C (**cerrada**) | CONSERVAR COMO REFERENCIA | REESCRIBIR (derivado) — hecho |
| Project North / Projection Basis | LR3-D (**cerrada**) | CONSERVAR COMO REFERENCIA | REESCRIBIR — contrato v1 (+Y North) |
| Workplane / SpatialReferenceContext | WP-v1 (**cerrada**) | CONSERVAR COMO REFERENCIA | REESCRIBIR — derivado storey; no en `.axon` |
| Technical View Transform | LR4 | REIMPLEMENTAR CUANDO SE ABRA SU FASE | APLAZAR |
| Drawing Scale | LR4 | REIMPLEMENTAR CUANDO SE ABRA SU FASE | APLAZAR |
| Semantic Drawing Layers | LR4 | REIMPLEMENTAR CUANDO SE ABRA SU FASE | APLAZAR |
| Render invalidation | LR5 | REIMPLEMENTAR CUANDO SE ABRA SU FASE | APLAZAR |
| IFC recognition policy | LR6 | REIMPLEMENTAR CUANDO SE ABRA SU FASE | APLAZAR (doc antes de parser) |
| Grid adaptativo / datums UX | LR7 | REIMPLEMENTAR CUANDO SE ABRA SU FASE | APLAZAR |
| Plan integración selectiva PDF | LR0 (**cerrada**) | CONSERVAR COMO REFERENCIA | CONSERVAR |
| Plan Maestro PDF | — | CONSERVAR COMO REFERENCIA | CONSERVAR |
| Wall joins mutando p1/p2 | — | NO REUTILIZAR | DESCARTAR (Web: eje + miter) |
| Godot / JSON-RPC / Python núcleo / SQLite History / GPL | — | NO REUTILIZAR | DESCARTAR |
| IFC como SoT interno | — | NO REUTILIZAR | DESCARTAR |
| Planos por aristas trianguladas | — | NO REUTILIZAR | DESCARTAR |

## Resumen de decisiones

| Componente | Estado | Decisión |
|------------|--------|----------|
| WallSpec | confirmado | REESCRIBIR (concepto → `Wall`) |
| WallOpeningSpec | confirmado | APLAZAR |
| SlabSpec | confirmado | APLAZAR |
| Geometría analítica / wall_box_mesh | confirmado | REESCRIBIR + PORTAR PRUEBAS |
| wall_box_mesh_with_openings | confirmado | APLAZAR |
| slab_prism_mesh | confirmado | APLAZAR |
| Snapping / trazado encadenado | confirmado | REESCRIBIR |
| SnapSession + histéresis | documental LR1 | REESCRIBIR (cuando se autorice LR1) |
| Restart Chain | documental LR1-B | REESCRIBIR |
| Command Transactions | documental LR2 | REESCRIBIR |
| Active Storey / Storey Datum | LR3 cerrada | REESCRIBIR — hecho |
| Model Envelope | LR3-C cerrada | REESCRIBIR (derivado) — hecho |
| Projection Basis / Project North | LR3-D cerrada | REESCRIBIR — contrato v1 |
| Workplane / SpatialReferenceContext | WP-v1 cerrada | REESCRIBIR — hecho (derivado) |
| Technical Views / Drawing Scale / Layers | documental LR4 | APLAZAR |
| Render invalidation | documental LR5 | APLAZAR |
| IFC recognition policy | documental LR6 | APLAZAR |
| Grid adaptativo | documental LR7 | APLAZAR |
| Push/Pull (wall_extrude) | confirmado | APLAZAR |
| JSON-RPC | confirmado | DESCARTAR (arquitectura) |
| SQLite history | confirmado | REESCRIBIR (comandos en sesión) |
| topo_id / B-Rep general | parcial/documental | APLAZAR / VERIFICAR |
| IFC | confirmado | APLAZAR (adaptador futuro) |
| DXF / ortho_snapshot | existente | APLAZAR |
| Godot / main_scene / GDScript | confirmado | DESCARTAR |
| Python backend estructural | confirmado | DESCARTAR |
| Reglas .cursor desktop (17) | confirmadas | CONSERVAR espíritu → 8 mandatos web |
| Plan Maestro PDF | confirmado | CONSERVAR como referencia |
| Plan integración selectiva PDF | confirmado | CONSERVAR como referencia |

---

## Fichas

### WallSpec

- **Archivo anterior:** `src/axonbim/geometry/wall_spec.py`
- **Responsabilidad:** Parámetros de muro caja (p1, p2, height, thickness, openings)
- **Estado real:** confirmado
- **Comportamiento útil:** Modelo paramétrico simple en metros; serialización dict
- **Problema:** Acoplado a flujo IFC/Godot
- **Casos de prueba:** Validación longitud/espesor/altura; roundtrip dict
- **Invariantes:** Eje p1–p2; altura > 0; espesor > 0
- **Destino web:** `Wall` en document-model; sin openings en MVP
- **Decisión:** REESCRIBIR

### wall_box_mesh

- **Archivo anterior:** `src/axonbim/geometry/meshing.py` (`wall_box_mesh`)
- **Responsabilidad:** Prisma de muro → malla
- **Estado real:** confirmado
- **Comportamiento útil:** Extrusión +Z; grosor centrado; misma geom para vista
- **Casos de prueba:** `tests/unit/geometry/test_meshing.py`, snapshots
- **Invariantes:** Ver geometry-policy (bbox, volumen, longitud)
- **Destino web:** paquete `geometry` (futuro)
- **Decisión:** REESCRIBIR + PORTAR PRUEBAS

### Snapping y trazado encadenado

- **Archivo anterior:** herramientas UI Godot + handlers de creación
- **Responsabilidad:** UX de dibujo continuo de muros
- **Estado real:** confirmado (comportamiento de producto)
- **Comportamiento útil:** Ortogonal, extremos, Escape cancela preview, cadena P2→P1 siguiente
- **Destino web:** session / tools (`sketchToolSlice`); Web ya tiene snap básico
- **Decisión:** REESCRIBIR
- **Clasificación LR:** base de LR1 / LR1-B

### SnapSession + histéresis (LR1)

- **Área anterior:** snap con lock temporal de eje (Desktop)
- **Responsabilidad:** Evitar oscilación libre ↔ orto cerca del umbral angular
- **Estado real:** solo documental en Web (comportamiento Desktop a recuperar)
- **Comportamiento útil:** LOCK eje → mantener → UNLOCK al alejarse; endpoint precede; Escape limpia
- **Problema Web actual:** decisión orto por frame puede oscilar
- **Invariantes:** estado temporal fuera de `AxonDocument`; no entra en Undo
- **Destino web:** estado de herramienta / session (no documento)
- **Decisión:** REESCRIBIR cuando se autorice LR1
- **Clasificación LR:** REIMPLEMENTAR CUANDO SE ABRA SU FASE
- **No reutilizar:** thresholds literales Desktop, GDScript, estado global antiguo

### Restart Chain (LR1-B)

- **Dependencia:** LR1
- **Comportamiento útil:** `restartChainAt(point)` — nueva cadena sin salir de Wall tool
- **Invariantes:** no crea muro; no historial; no muta documento; limpia segmento incompleto
- **Decisión:** REESCRIBIR cuando se autorice LR1-B
- **Clasificación LR:** REIMPLEMENTAR CUANDO SE ABRA SU FASE

### Command Transactions / Composite (LR2)

- **Área anterior:** operaciones compuestas Desktop (p. ej. commit sketch multi-paso)
- **Responsabilidad:** Una acción lógica → una entrada de historial; fallo → documento intacto
- **Estado real:** Web tiene `HistoryStack` + comandos simples; sin transacción compuesta
- **Destino web:** `packages/commands` (nombre Web a decidir)
- **Decisión:** REESCRIBIR cuando se autorice LR2
- **Clasificación LR:** REIMPLEMENTAR CUANDO SE ABRA SU FASE

### Active Storey / Storey Datum (LR3-A / B) — **hecho 2026-08-09**

- **Web:** `packages/model` `activeStorey` / `storeyDatum`; session `activeStoreyId`
- **Invariantes:** datum no es segunda SoT; creación vía `getActiveStorey`; reconcile en open/new
- **Clasificación LR:** CONSERVAR COMO REFERENCIA (Desktop); Web cerrado

### Model Envelope (LR3-C) — **hecho 2026-08-09**

- **Web:** `computeModelEnvelope` en `@axonbim/model`; pivot órbita en Viewport
- **Invariantes:** regenerable 100% desde `AxonDocument`; no persistido
- **Clasificación LR:** CONSERVAR COMO REFERENCIA; Web cerrado

### Project North / Projection Basis (LR3-D) — **hecho 2026-08-09**

- **Web:** `getProjectionBasis` / `projectWorldToDrawing`; +Y = Project North
- **Fuera de v1:** rotación de Project North
- **Clasificación LR:** CONSERVAR COMO REFERENCIA; contrato listo para LR4

### Workplane / SpatialReferenceContext (WP-v1) — **hecho 2026-08-09**

- **Web:** `workplaneFromStorey`, `resolveSpatialReference`, `projectPointOntoWorkplane`
- **Invariantes:** derivado del storey; no persistido; tools no acoplan a cámara; modos no mezclan reglas
- **Clasificación LR:** CONSERVAR COMO REFERENCIA; Web cerrado
- **Parked tras WP-v1 / SK-v1:** Edit Mode, planos custom, Push&Pull, arcos sketch

### Technical View Core (LR4)

- **Piezas:** TechnicalViewTransform, Drawing Scale, Semantic Drawing Layers → DrawingModel → SVG/PDF/DXF
- **Invariante:** no capturar plano técnico desde cámara Three.js
- **Decisión:** APLAZAR hasta auth documentación 2D
- **Clasificación LR:** REIMPLEMENTAR CUANDO SE ABRA SU FASE

### Render invalidation (LR5)

- **Problema futuro:** loop `requestAnimationFrame` continuo vs render bajo demanda
- **Decisión:** APLAZAR hasta evidencia de coste / multivista
- **Clasificación LR:** REIMPLEMENTAR CUANDO SE ABRA SU FASE

### IFC Recognition Policy (LR6)

- **Principio:** solo nativo BIM si parámetros reconocibles de forma demostrable; si no → foreign / unsupported
- **No reutilizar:** mutación IFC por gesto; session IFC como SoT; heurísticas de unidades no demostrables
- **Decisión:** APLAZAR; actualizar ADR 0003 antes del importador
- **Clasificación LR:** REIMPLEMENTAR CUANDO SE ABRA SU FASE

### Grid adaptativo / datums visuales (LR7)

- **Dependencia:** LR3
- **Restricción:** UX derivada; nunca lógica geométrica del modelo
- **Decisión:** APLAZAR
- **Clasificación LR:** REIMPLEMENTAR CUANDO SE ABRA SU FASE

### Historial SQLite

- **Archivo anterior:** `src/axonbim/history/*`
- **Responsabilidad:** Undo/redo persistente
- **Estado real:** confirmado
- **Comportamiento útil:** Operaciones reversibles con identidad
- **Problema:** Persistencia acoplada a SQLite; no copiar
- **Destino web:** `commands` + HistoryStack en sesión
- **Decisión:** REESCRIBIR (concepto)

### JSON-RPC / rpc/*

- **Archivo anterior:** `src/axonbim/rpc/*`
- **Responsabilidad:** Puente Godot↔Python
- **Estado real:** confirmado
- **Problema:** Complejidad de dos procesos innecesaria en web local-first
- **Decisión:** DESCARTAR como arquitectura interna

### IFC session / wall IFC

- **Archivo anterior:** `src/axonbim/ifc/*`
- **Responsabilidad:** Semántica IFC en sesión
- **Estado real:** confirmado
- **Problema:** Mutar IFC en cada gesto prematuro para web MVP
- **Destino web:** adaptador futuro (ADR 0003)
- **Decisión:** APLAZAR

### WallOpeningSpec / openings

- **Archivo anterior:** `wall_spec.py`, `meshing.py`, `ifc/opening.py`
- **Decisión:** APLAZAR (post-MVP / puertas-ventanas)

### SlabSpec / slab mesh

- **Decisión:** APLAZAR

### Push/Pull wall_extrude

- **Archivo anterior:** `geometry/wall_extrude.py`, `handlers/geom.py`
- **Decisión:** APLAZAR

### Topología B-Rep / topo_id

- **Archivo anterior:** `geometry/topology.py`, docs `topological-naming.md`
- **Estado real:** parcial (docs > implementación en partes)
- **Decisión:** VERIFICAR PRIMERO / APLAZAR — MVP solo IDs de elemento

### Godot frontend

- **Decisión:** DESCARTAR — sustituir por React + Three.js

### draw.ortho_snapshot / DXF

- **Decisión:** APLAZAR — documentación 2D futura

### Reglas Cursor desktop

- **Archivo anterior:** `.cursor/rules/*.mdc` (17)
- **Decisión:** CONSERVAR COMO CONCEPTO — unificadas en `.cursor/rules/` de este repo (8 archivos)

### Normativa MIVED / ISO 19650 (docs desktop)

- **Decisión:** APLAZAR — fuera del MVP web inicial

### Plan de integración selectiva (PDF)

- **Archivo:** `docs/migration/plan-integracion-selectiva-logica-reutilizable.pdf`
- **Responsabilidad:** Roadmap transversal LR0–LR7; gates; prohibiciones de port
- **Decisión:** CONSERVAR COMO REFERENCIA
- **Clasificación LR:** CONSERVAR COMO REFERENCIA (LR0 formaliza su uso en Web)
