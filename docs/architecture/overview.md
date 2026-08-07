# Arquitectura — overview

## Regla central

```
UI (React) → Tool → Command → AxonDocument → Geometry → Representation (2D / Three.js)
```

El documento no conoce React, Three.js, IndexedDB, IFC, OpenCascade ni APIs del navegador.

## Capas

| Capa | Responsabilidad | No puede |
|------|-----------------|----------|
| **model** (`AxonDocument`) | Entidades, IDs, validación, serialización | Importar UI, viewer, browser APIs |
| **commands** | Mutaciones reversibles (`execute` / `undo`) | Renderizar ni leer DOM |
| **geometry** | Reglas analíticas → malla / proyección | Poseer estado de proyecto |
| **tools** | Gestos, preview, snapping de interacción | Confirmar mutaciones sin comando |
| **viewer** | Three.js + planta como adaptadores | Ser fuente de verdad |
| **persistence** | `.axon` JSON v1 | Definir semántica de negocio aparte del modelo |
| **React UI** | Layout, paneles, orquestación | Mutar el documento directamente |

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
- [coordinate-system.md](coordinate-system.md)
- [geometry-policy.md](geometry-policy.md)
- [commands-and-history.md](commands-and-history.md)
- ADRs en [../decisions/](../decisions/)
