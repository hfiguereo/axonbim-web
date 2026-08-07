# Fases de trabajo operativas

Mapa del plan maestro a oleadas reales. **Sin código de aplicación en F0–F1.**

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

## F2 — Etapa 0 visible (futuro, código)

Scaffold: pnpm, Vite, React, Three.js, Vitest, Playwright.  
Entrega: app que abre, layout, nuevo/abrir/demo stub, visor, propiedades, panel de estado.

**Criterio:** evaluable visualmente sin modelar aún.

## F3 — Etapa 1 primer muro (futuro)

Corte vertical: P1→P2→Wall→geometría→planta+3D→selección→propiedades→undo/redo desde UI.

## F4 — Etapa 2 MVP estricto (futuro)

Encadenado, snapping, familias, demo, import/export, pruebas.  
Luego **pausa obligatoria de producto**.

## F5+ — Post-MVP (solo con autorización)

Puertas/ventanas y siguientes capacidades del maestro.

## Estructura de paquetes prevista (no creada aún)

```
axonbim-web/
├── apps/web/
├── packages/
│   ├── model/
│   ├── commands/
│   ├── geometry/
│   ├── tools/
│   ├── viewer/
│   ├── families/
│   ├── persistence/
│   └── shared/
├── samples/demo-house/
└── docs/   (ya existe)
```
