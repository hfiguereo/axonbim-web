# AGENTS.md — AxonBIM Web

Punto de entrada para agentes de IA. Lee esto antes de cualquier cambio material.

## Cómo trabajar aquí

1. **Lee las reglas activas** en `.cursor/rules/` (mandatos cortos).
2. **Lee la documentación de soporte** bajo `docs/` para el dominio que toques. El detalle vive en docs, no en las rules.
3. **No copies ni traduzcas** el desktop Godot/Python. Portar = comportamiento → prueba → invariante → especificación → implementación nueva. Ver `docs/migration/migration-rules.md`.
4. **Post-MVP:** puertas (0010), ventanas (0011) y **gizmo→cámaras (0012)** autorizados. Cola: Playwright. No abras IFC sin autorización.
5. **No dupliques controles UI** (cinta vs status vs opciones) salvo petición explícita. Ver `docs/ui/interface-base.md` (anti-redundancia).

## Índice de lectura

| Si vas a… | Lee primero |
|-----------|-------------|
| Entender el producto | `docs/product/vision.md`, `mvp-scope.md`, `non-negotiables.md` |
| Tocar arquitectura / capas | `docs/architecture/overview.md` + ADR en `docs/decisions/` |
| Modelo / IDs / `.axon` | `docs/architecture/document-model.md` |
| Coordenadas / tolerancias | `docs/architecture/coordinate-system.md` |
| Geometría | `docs/architecture/geometry-policy.md` |
| Comandos / historial | `docs/architecture/commands-and-history.md` |
| Legado desktop | `docs/migration/legacy-inventory.md`, `migration-rules.md` |
| Validar MVP | `docs/validation/acceptance-matrix.md` |
| UI / layout | `docs/ui/interface-base.md` (base aprobada), `revit-lt-baseline.md`, `axonbim-shell-v0.md` |
| Saber en qué fase estamos | `docs/roadmap/work-phases.md`, `docs/roadmap/gates.md` |

## Prohibiciones

- Inventar APIs, valores normativos o comportamiento “porque el desktop lo tenía documentado”.
- Añadir IFC, DXF, OpenCascade, PWA, OPFS o paquetes fuera del alcance autorizado.
- Mutar el documento desde React o Three.js.
- Introducir JSON-RPC interno entre UI y dominio.
- Expansión silenciosa: terminar la tarea, proponer mejoras aparte, esperar autorización.
- Borrar o debilitar pruebas para hacer pasar CI.

## Comandos

```bash
pnpm install
pnpm dev          # apps/web → http://localhost:5173
pnpm build
pnpm test
pnpm typecheck
```

## Paradas obligatorias

Tras F0, F1, Etapa 0, Etapa 1 y MVP: **detenerse** para evaluación humana. No continuar a la siguiente gran etapa sin autorización explícita. Ver `docs/roadmap/gates.md`.
