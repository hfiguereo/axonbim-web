# AxonBIM Web

Software BIM **web, local-first**, orientado a una experiencia de modelado pequeña, visible y convincente antes de añadir complejidad.

**Autor:** Arq. Hector Nathanael Figuereo  
**Licencia:** [Propietaria — All Rights Reserved](LICENSE) ([ADR 0007](docs/decisions/0007-proprietary-license.md))  
**Estado:** ADR 0015 cámaras geométricas — gizmo tríada 0014; F5-S aprobado  
**Remoto:** https://github.com/hfiguereo/axonbim-web

## Qué es

Una reconstrucción controlada del producto AxonBIM para el navegador:

- **Documento paramétrico** como fuente de verdad
- **Comandos** para toda mutación confirmada
- **Geometría analítica** (sin kernel CAD en el MVP)
- **React** para UI; **Three.js** solo como adaptador de representación

No es un port del desktop Godot/Python ni una traducción automática de ese código.

## Etapa 0 (hecho)

Shell inspirado en **productos de referencia** BIM (base de interfaz futura): menú Archivo, cinta de iconos, opciones de herramienta, Modificar/Dibujar/Cadena, compositor de paneles izq./der., navegador, propiedades, vistas, barra de vista.  
Nuevo / Abrir / Demo / Exportar `.axon`. Visor planta/3D. **Etapa 1:** Muro → trazar en planta (cadena), selección, propiedades, undo/redo.

UI de referencia: [docs/ui/interface-base.md](docs/ui/interface-base.md).

### Requisitos

- Node.js 22+
- pnpm 10+ (`corepack enable && corepack prepare pnpm@10.12.1 --activate`)

### Comandos

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build
pnpm test
pnpm test:e2e # Playwright F8 (local; ver docs/validation/playwright-f8.md)
```

## Documentación

| Área | Documento |
|------|-----------|
| Visión | [docs/product/vision.md](docs/product/vision.md) |
| MVP | [docs/product/mvp-scope.md](docs/product/mvp-scope.md) |
| Principios | [docs/product/non-negotiables.md](docs/product/non-negotiables.md) |
| Arquitectura | [docs/architecture/overview.md](docs/architecture/overview.md) |
| Migración | [docs/migration/migration-rules.md](docs/migration/migration-rules.md) |
| Fases | [docs/roadmap/work-phases.md](docs/roadmap/work-phases.md) |
| Gates | [docs/roadmap/gates.md](docs/roadmap/gates.md) |
| UI (base) | [docs/ui/interface-base.md](docs/ui/interface-base.md) |
| Agentes | [AGENTS.md](AGENTS.md) |

## Estructura

```
apps/web/          Vite + React shell
packages/model/    AxonDocument
packages/commands/ Historial (stub + stack)
packages/geometry/ Geometría analítica (stub)
packages/viewer/   Adaptador Three.js
packages/…         families, persistence, tools, shared
docs/              Fuente de verdad amplia
```

## Gobernanza

Decisiones estructurales requieren aprobación explícita del autor. Los agentes siguen [AGENTS.md](AGENTS.md) y [.cursor/rules/](.cursor/rules/).
