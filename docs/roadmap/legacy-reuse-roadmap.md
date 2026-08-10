# Roadmap — Integración selectiva de lógica reutilizable (LR)

**Hilo de avance del producto** tras F9-E y C3. La cola operativa vive en
[`pending-work.md`](pending-work.md); este doc detalla contratos y gates por bloque.

Fuente: [`../migration/plan-integracion-selectiva-resumen.md`](../migration/plan-integracion-selectiva-resumen.md)
→ PDF completo. Inventario: [`../migration/legacy-inventory.md`](../migration/legacy-inventory.md).

**No implementar** un bloque sin frase explícita en el chat. Cada bloque = gate propio.

## Clasificación de piezas heredadas

| Etiqueta | Significado |
|----------|-------------|
| **REIMPLEMENTAR AHORA** | Listo para auth del bloque actual |
| **REIMPLEMENTAR CUANDO SE ABRA SU FASE** | Parked hasta su turno en la cola |
| **CONSERVAR COMO REFERENCIA** | Consulta; no copiar |
| **NO REUTILIZAR** | Prohibido (arquitectura / GPL / SoT incorrecto) |

## Cola LR (alineada con pending-work)

| Bloque | Estado | Gate (cierre) |
|--------|--------|---------------|
| **LR0** Formalización docs | **cerrada** 2026-08-09 | Comportamiento recuperable descrito sin Python/Godot/RPC/SQLite/IFC-interno |
| **LR1** SnapSession + histéresis | **cerrada** 2026-08-09 | Enter 12° / hold 22°; SnapSession fuera de `AxonDocument` |
| **LR1-B** Restart Chain | **cerrada** 2026-08-09 | Reinicio = interacción; no mutación BIM / historial |
| **LR1-C** Snaps geométricos | **parked** | Midpoint / perpendicular / proyecciones — ver §LR1-C |
| **LR2** Command Transactions | **cerrada** 2026-08-09 | `CompositeCommand` atómico en documento + history |
| **LR3-A** Active Storey | **cerrada** 2026-08-09 | `activeStoreyId` + `getActiveStorey`; creación no usa `storeys[0]` |
| **LR3-B** Storey Datum | **cerrada** 2026-08-09 | `deriveStoreyDatums` derivado; no es SoT |
| **LR3-C** Model Envelope | **cerrada** 2026-08-09 | `computeModelEnvelope` regenerable 100% |
| **LR3-D** Projection Basis | **cerrada** 2026-08-09 | `getProjectionBasis` TOP/N/S/E/W; Project North = +Y |
| **WP-v1** Workplane | **cerrada** 2026-08-09 | Storey → Workplane; tools vía `resolveSpatialReference` |
| **SK-v1** Sketch Mode | **cerrada** 2026-08-09 | Rectángulo → muros paramétricos (CompositeCommand) |
| **SK-sel** Sketch selección | **cerrada** 2026-08-09 | Doble clic / Editar perfil → contexto + Dibujar |
| **Edit Mode** / losas·terreno·barridos | **siguiente** (auth) | [`editing-paradigms.md`](../architecture/editing-paradigms.md) |
| **LR4** Technical View Core | parked | Representación técnica sin depender de Three.js/DXF |
| **LR5** Render invalidation | parked | Optimización sin cambiar semántica BIM |
| **LR6** IFC Recognition Policy | parked (doc) | ADR IFC actualizado antes del importador |
| **LR7** Grid adaptativo | parked | Solo UX; no entra en lógica geométrica del modelo |

## LR1-C — Snaps geométricos (parked, 2026-08-09)

**No implementar** sin auth explícita. Expande el snap más allá de extremos/orto/cierre.

| Candidato | Idea |
|-----------|------|
| Midpoint | Punto medio de eje de muro (y luego aristas) |
| Perpendicular | Pie de perpendicular desde cursor a segmento |
| (futuro) | Intersección segmento–segmento; proyección a eje |

Precedencia tentativa (cuando se abra):

`cierre → extremo → midpoint → perpendicular → orto (histéresis) → libre`

Invariantes: estado en `SnapSession` / tools; fuera de `AxonDocument`; Esc limpia; tests por tipo;
umbrales Web propios (no copiar Desktop).

## Dependencias

```
F9-E + C3 + LR0–LR3 + WP-v1 + SK-v1 (hecho) ──► Edit Mode / expansiones
LR1 ──► LR1-C (parked)
LR3-D ──► LR4 (Technical Views)
Multivista / coste ──► LR5
Fase IFC ──► LR6 ──► parser / recognizers
```

## LR3 — Spatial Reference Context (cerrada 2026-08-09)

| Pieza | API | Notas |
|-------|-----|-------|
| A Active Storey | `reconcileActiveStoreyId` / `getActiveStorey` · session `activeStoreyId` | Tools vía resolver; open/new reconcilia |
| B Storey Datum | `deriveStoreyDatums` | Solo UI/contexto; no muta BIM |
| C Model Envelope | `computeModelEnvelope` | AABB derivado; pivot órbita lo consume |
| D Projection Basis | `getProjectionBasis` / `projectWorldToDrawing` | Contrato para Viewer y LR4; sin rotación Project North aún |

## Informe obligatorio por bloque (antes de programar)

Problema · comportamiento Desktop recuperado · datos · invariantes · componentes Web ·
qué **no** se reutiliza · tests previstos.

Tras programar: archivos · explicación · tests + resultados · impacto · Undo/Redo si
aplica · persistencia si aplica · docs.

## Relación con lo cerrado

- **F9-E** (S1–S6): cerrada — prerrequisito de expansión sensible cumplido.
- **C3** crop cámara: cerrada — no reabre ni desplaza la cola LR.
- Fase 4 “elige un parked” queda **sustituida** por esta secuencia LR como hilo único de
  avance; los parked clásicos (OCCT, IFC, PWA) siguen fuera hasta auth + prerreq.

## Prohibido recuperar como solución Web

Wall joins mutando extremos · Godot · JSON-RPC · Python núcleo · SQLite History · código GPL ·
IFC como SoT · planos por aristas trianguladas. Ver PDF §21.
