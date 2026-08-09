# Arquitectura — overview

## Regla central

```
UI (React) → Tool → Command → AxonDocument → Geometry → Representation (2D / Three.js)
```

El documento no conoce React, Three.js, IndexedDB, IFC, OpenCascade ni APIs del navegador.

## Capas

| Capa | Responsabilidad | No puede |
|------|-----------------|----------|
| **model** (`AxonDocument`) | Entidades, IDs, **predicados de dominio** (`validate*`, `openingFit`, catálogos) | Importar UI, viewer, browser APIs |
| **commands** | Mutaciones reversibles (`execute` → `CommandResult` / `undo`) | Renderizar ni leer DOM; inventar reglas fuera de `model` |
| **geometry** | Reglas analíticas → malla / proyección (muros, huecos, joins) | Poseer estado de proyecto |
| **tools** | Gestos, preview, snapping; consumen Workplane de sesión (no inventan plano) | Confirmar mutaciones sin comando |
| **viewer** | Three.js + planta como adaptadores | Ser fuente de verdad |
| **persistence** | Frontera `.axon` (forma, caps, Abrir estricto / Recuperar); reutiliza predicados de `model` | Definir semántica de negocio distinta del modelo |
| **React UI** | Layout, paneles, orquestación, crops de sesión | Mutar `walls[]` / `cameras[]` directamente |

Validación de negocio vive en **`@axonbim/model`** (ADR 0017). Commands y persistence la
consumen; la UI puede pre-chequear para mensajes, pero el comando **siempre** revalida.
Serialización JSON del archivo es **persistence**; el shape del documento en memoria es **model**.

## Decisiones heredadas que se conservan como concepto

- Modelo autoritativo vs representación
- Geometría analítica (no B-Rep general en MVP)
- Identidad estable de elementos
- Operaciones reversibles
- Una geometría alimenta planta y 3D

## Decisiones que no se portan

JSON-RPC, proceso Python, Godot, worker headless, SQLite como historial canónico, IFC en cada gesto.

## Documentos relacionados

- [document-model.md](document-model.md)
- [coordinate-system.md](coordinate-system.md) — ejes, storey, Projection Basis, Workplane
- [geometry-policy.md](geometry-policy.md)
- [editing-paradigms.md](editing-paradigms.md) — Parametric / Sketch / Edit; WP-v1 compartido
- [commands-and-history.md](commands-and-history.md)
- ADRs en [../decisions/](../decisions/)
- Integridad F9-E: [../roadmap/domain-invariants-plan.md](../roadmap/domain-invariants-plan.md)
- Workplanes: [../roadmap/workplanes-roadmap.md](../roadmap/workplanes-roadmap.md)
