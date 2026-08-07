# Fases de trabajo operativas

Mapa del plan maestro a oleadas reales.

## F0 — Fundación (hecho en este repo)

- Repo git independiente
- Docs de producto, arquitectura, migración, ADR, validación
- `AGENTS.md` + `.cursor/rules` unificadas
- PDF plan maestro en `docs/migration/`

## F1 — Contratos de dominio (docs)

Cerrado en documentación:

- Coordenadas y tolerancias
- `AxonDocument`, IDs, `.axon` v1
- Comandos e historial
- Política geométrica y equivalencia
- Inventario legado fichado

**Gate:** aprobación humana antes de Etapa 0.

## F2 — Etapa 0 visible (hecho)

Scaffold: pnpm workspace, Vite, React, Three.js, paquetes de dominio.  
Entrega: app abrible (`pnpm dev`), maqueta UI Revit LT, compositor de paneles, cinta/Modificar/Cadena, visor, `.axon` stub.

**Criterio:** evaluable visualmente → **G-E0 aprobado** (2026-08-06). Base: `docs/ui/interface-base.md`.

## Estructura de paquetes (creada)

```
apps/web/
packages/{model,commands,geometry,tools,viewer,families,persistence,shared}/
samples/demo-house/
docs/
```

## F3 — Etapa 1 primer muro (hecho — G-E1)

Corte vertical: P1→P2→`wall.create`→`wallBoxMesh`→planta+3D→selección→propiedades→undo/redo.  
Cadena on por defecto; modo Línea; otros Draw modes aún no.

## F4 — Etapa 2 MVP estricto (hecho — G-MVP)

Snap, inglete, demo, Fit, zoom rueda, gizmo maqueta, import/export `.axon`.  
**Pausa de producto** hasta autorización post-MVP.

## F5+ — Post-MVP (solo con autorización)

Puertas/ventanas, orientación real del gizmo, y siguientes capacidades del maestro.
