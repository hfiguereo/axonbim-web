# AxonBIM Web

Software BIM **web, local-first**, orientado a una experiencia de modelado pequeña, visible y convincente antes de añadir complejidad.

**Autor:** Arq. Hector Nathanael Figuereo  
**Licencia:** [Propietaria — All Rights Reserved](LICENSE) ([ADR 0007](docs/decisions/0007-proprietary-license.md))  
**Estado:** Fundación documental (sin aplicación aún)

## Qué es

Una reconstrucción controlada del producto AxonBIM para el navegador:

- **Documento paramétrico** como fuente de verdad
- **Comandos** para toda mutación confirmada
- **Geometría analítica** (sin kernel CAD en el MVP)
- **React** para UI; **Three.js** solo como adaptador de representación

No es un port del desktop Godot/Python ni una traducción automática de ese código.

## Qué no es (aún)

- Cliente Godot + backend Python con JSON-RPC
- Editor IFC en tiempo de gesto
- Documentación normativa MIVED completa
- Puertas, ventanas, losas, OpenCascade, colaboración

Ver [alcance del MVP](docs/product/mvp-scope.md).

## Documentación

| Área | Documento |
|------|-----------|
| Visión | [docs/product/vision.md](docs/product/vision.md) |
| MVP | [docs/product/mvp-scope.md](docs/product/mvp-scope.md) |
| Principios | [docs/product/non-negotiables.md](docs/product/non-negotiables.md) |
| Arquitectura | [docs/architecture/overview.md](docs/architecture/overview.md) |
| Migración desde desktop | [docs/migration/migration-rules.md](docs/migration/migration-rules.md) |
| Plan maestro (PDF) | [docs/migration/plan-maestro-axonbim-web.pdf](docs/migration/plan-maestro-axonbim-web.pdf) |
| Fases de trabajo | [docs/roadmap/work-phases.md](docs/roadmap/work-phases.md) |
| Aceptación MVP | [docs/validation/acceptance-matrix.md](docs/validation/acceptance-matrix.md) |
| Agentes | [AGENTS.md](AGENTS.md) |

## Stack previsto (Etapa 0+, aún no scaffolded)

TypeScript · pnpm · Vite · React · Three.js · Vitest · Playwright  
Estado de UI de sesión: Zustand (nunca el documento paramétrico).

## Repositorio

- Copia de trabajo local: este directorio
- Remoto principal: GitHub (`origin`) — ver [docs/roadmap/github.md](docs/roadmap/github.md)

## Gobernanza

Decisiones estructurales requieren aprobación explícita del autor. Los agentes siguen [AGENTS.md](AGENTS.md) y [.cursor/rules/](.cursor/rules/).
