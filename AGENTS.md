# AGENTS.md — AxonBIM Web

Punto de entrada para agentes de IA. Lee esto antes de cualquier cambio material.

## Cómo trabajar aquí

1. **Lee las reglas activas** en `.cursor/rules/` (mandatos cortos).
2. **Lee la documentación de soporte** bajo `docs/` para el dominio que toques. El detalle vive en docs, no en las rules. Política: `docs/product/doc-governance.md`.
3. **No copies ni traduzcas** el desktop Godot/Python. Portar = comportamiento → prueba → invariante → especificación → implementación nueva. Ver `docs/migration/migration-rules.md`.
4. **F5-S cerrado** (2026-08-07). **F8 Playwright oleada 1 autorizado** (estrecho, A+B, local) — ver `docs/validation/playwright-f8.md`. No IFC/OCCT/workplanes/CI-e2e sin auth.
5. **No dupliques controles UI** (cinta vs status vs opciones) salvo petición explícita. Ver `docs/ui/interface-base.md` (anti-redundancia).

## Índice de lectura

| Si vas a… | Lee primero |
|-----------|-------------|
| Entender el producto | `docs/product/vision.md`, `mvp-scope.md`, `non-negotiables.md`, `doc-governance.md` |
| Tocar arquitectura / capas | `docs/architecture/overview.md` + ADR en `docs/decisions/` |
| Modelo / IDs / `.axon` | `docs/architecture/document-model.md` |
| Coordenadas / tolerancias | `docs/architecture/coordinate-system.md` |
| Geometría | `docs/architecture/geometry-policy.md`; OCCT parked: ADR 0013 |
| Paradigmas edición / workplanes | `docs/architecture/editing-paradigms.md`, `docs/roadmap/workplanes-roadmap.md` (**parked**) |
| Comandos / historial | `docs/architecture/commands-and-history.md` |
| Legado desktop | `docs/migration/legacy-inventory.md`, `migration-rules.md` |
| Validar / auditoría | `docs/validation/acceptance-matrix.md`, `technical-audit-2026-08.md`, `playwright-f8.md`, `navigation-3d-checklist.md` |
| UI / layout | `docs/ui/interface-base.md`, `reference-shell-baseline.md`, `axonbim-shell-v0.md` |
| Fase / gates | `docs/roadmap/work-phases.md`, `gates.md`, **`f5-stabilization.md`** |
| Navegación 3D / gizmo | ADR 0014, `docs/validation/navigation-3d-checklist.md` |
| Cámaras geométricas | ADR 0015 |
| Región de recorte de vista | ADR 0016 |

## Prohibiciones

- Inventar APIs, valores normativos o comportamiento “porque el desktop lo tenía documentado”.
- Añadir IFC, DXF, OpenCascade, PWA, OPFS o paquetes fuera del alcance autorizado.
- Mutar el documento desde React o Three.js.
- Introducir JSON-RPC interno entre UI y dominio.
- Expansión silenciosa: terminar la tarea, proponer mejoras aparte, esperar autorización.
- Borrar o debilitar pruebas para hacer pasar CI.
- Recrear decisiones documentadas sin demostrar que el contrato vigente es insuficiente.

## Comandos

```bash
pnpm install
pnpm dev          # apps/web → http://localhost:5173
pnpm build
pnpm test
pnpm typecheck
```

## Paradas obligatorias

Tras F0, F1, Etapa 0, Etapa 1, MVP y F5-S: detenerse para evaluación humana. Ver `docs/roadmap/gates.md`. Playwright y expansiones parked requieren autorización nueva.
