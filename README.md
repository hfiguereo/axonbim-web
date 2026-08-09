# AxonBIM Web

Software BIM **web, local-first**, orientado a una experiencia de modelado pequeña, visible y convincente antes de añadir complejidad.

**Autor:** Arq. Hector Nathanael Figuereo  
**Licencia:** [Propietaria — All Rights Reserved](LICENSE) ([ADR 0007](docs/decisions/0007-proprietary-license.md))  
**Estado:** F5-S + F8 aprobados; F9-E1–E5 cerradas (integridad documento); ADR 0014–0016  
**Remoto:** https://github.com/hfiguereo/axonbim-web

## Qué es

Una reconstrucción controlada del producto AxonBIM para el navegador:

- **Documento paramétrico** como fuente de verdad (`AxonDocument`)
- **Comandos** con `CommandResult` para toda mutación confirmada
- **Geometría analítica** (muros, joins, huecos; sin kernel CAD)
- **React** para UI; **Three.js** solo como adaptador de representación

No es un port del desktop Godot/Python ni una traducción automática de ese código.

## Capacidad actual (resumen)

Shell tipo producto de referencia BIM: Archivo (Nuevo / Abrir / **Recuperar copia…** /
Demo / Exportar `.axon`), cinta, paneles, navegador, propiedades.  
Modelado: muros en cadena, puertas/ventanas hospedadas, cámaras geométricas + crop de
vista, undo/redo, gizmo 3D. Integridad de dominio y frontera `.axon`: ver
[docs/roadmap/domain-invariants-plan.md](docs/roadmap/domain-invariants-plan.md).

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
pnpm check:docs
pnpm check:links
```

## Documentación

| Área | Documento |
|------|-----------|
| Visión | [docs/product/vision.md](docs/product/vision.md) |
| MVP | [docs/product/mvp-scope.md](docs/product/mvp-scope.md) |
| Principios | [docs/product/non-negotiables.md](docs/product/non-negotiables.md) |
| Arquitectura | [docs/architecture/overview.md](docs/architecture/overview.md) |
| Pendientes | [docs/roadmap/pending-work.md](docs/roadmap/pending-work.md) |
| Migración | [docs/migration/migration-rules.md](docs/migration/migration-rules.md) |
| Gates | [docs/roadmap/gates.md](docs/roadmap/gates.md) |
| Agentes | [AGENTS.md](AGENTS.md) |

## Estructura

```
apps/web/          Vite + React shell + session
packages/model/    AxonDocument + predicados de dominio
packages/commands/ HistoryStack + comandos muro/puerta/ventana/cámara
packages/geometry/ Mallas analíticas (muros, huecos, joins)
packages/viewer/   Adaptador Three.js
packages/…         families, persistence, tools, shared
docs/              Contratos, ADRs, validación
```

## Gobernanza

Decisiones estructurales requieren aprobación explícita del autor. Los agentes siguen [AGENTS.md](AGENTS.md) y [.cursor/rules/](.cursor/rules/).
