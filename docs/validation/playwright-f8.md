# F8 — Playwright oleada 1 (autorizado 2026-08-07)

## Autorización

| Punto | Decisión |
|-------|----------|
| 1 Alcance | **Estrecho** (humo; no dibujo canvas / grips / gizmo) |
| 2 Tipo | **A + B** — comportamiento y capturas UI |
| 3 Dónde | **Solo local** (`pnpm test:e2e`) — CI no incluido aún |
| 4 Fuera | IFC · OCCT · workplanes · PWA · refactor `sessionStore` |

## Qué cubre

**A (funcional):** carga, Abrir demo, Nuevo, exportar/reabrir `.axon`, Deshacer tras borrar muro (hook `__AXON_E2E__` no-prod).

**B (visual):** screenshots full-page con **canvas enmascarado** (no comparamos píxeles WebGL). Baselines en `e2e/*-snapshots/`.

## Comandos

```bash
pnpm exec playwright install chromium   # una vez
pnpm test:e2e                           # correr
pnpm test:e2e:update                    # regenerar capturas B
```

## Hooks UI

`data-testid`: `app-shell`, `file-menu`, `file-open-input`, `status-msg`, `status-meta`.
