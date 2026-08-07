# Inventario legado — AxonBIM desktop → Web

Fuente de matriz inicial: Plan Maestro §31. Legado de referencia: `axonBIM-develop` (zip; fuera de este repo).

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
- **Destino web:** paquete `tools` (futuro)
- **Decisión:** REESCRIBIR

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
