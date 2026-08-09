# F8 — Playwright

## Oleada 1 — **aprobado** 2026-08-08

| Punto | Decisión |
|-------|----------|
| Alcance | Estrecho (humo; no dibujo canvas / grips / gizmo) |
| Tipo | A + B — comportamiento y capturas UI |
| Dónde | Local (`pnpm test:e2e`) |
| Cierre humano | Checklist 1–5 OK |

**A:** carga, Abrir demo, Nuevo, exportar/reabrir `.axon`, Deshacer tras borrar muro.  
**B:** screenshots full-page con canvas enmascarado (`e2e/*-snapshots/`).

## Oleada 2 — **autorizada** 2026-08-08

| Punto | Decisión |
|-------|----------|
| Alcance | Puerta + ventana + cámara vía hooks `__AXON_E2E__` (sin gestos frágiles en canvas) |
| Tipo | A (funcional) — sin capturas nuevas en o2 |
| Fuera | Gizmo WebGL · crop grips · CI-only flakes de píxeles · IFC/OCCT/Sketch-Edit |

**A o2:** demo → colocar puerta / ventana / cámara → contadores en status → Deshacer.

## F8-CI — **autorizado** 2026-08-08

GitHub Actions en `push`/`pull_request` a `main`: `pnpm test:e2e` (oleadas 1+2).  
Workflow: `.github/workflows/e2e.yml`.

## Comandos

```bash
pnpm exec playwright install chromium   # una vez (local)
# Cierra `pnpm dev` en 5173 antes, o deja que Playwright arranque el suyo
pnpm test:e2e
pnpm test:e2e:update                    # solo regenerar capturas B (o1)
```

## Hooks UI / E2E

`data-testid`: `app-shell`, `file-menu`, `file-open-input`, `status-msg`, `status-meta`  
(`status-meta` incluye `walls` / `doors` / `windows` / `cameras`).

`window.__AXON_E2E__` (solo no-production): muro, puerta, ventana, cámara, undo.

## Checklist humana — cierre F8 oleada 1

| # | Qué ver / hacer | OK |
|---|-----------------|----|
| 1 | `pnpm test:e2e` verde | x |
| 2 | Alcance estrecho o1 entendido | x |
| 3 | Capturas B = chrome, no 3D | x |
| 4 | Solo local (antes de CI) | x |
| 5 | Snapshots revisados o aceptados | x |

**Cerrado 2026-08-08.**

## Checklist — F8-CI + oleada 2 (tras implementar)

| # | Criterio | OK |
|---|----------|----|
| 1 | `pnpm test:e2e` verde local (o1+o2) | x (2026-08-08) |
| 2 | Workflow CI verde en `main` (o PR) | x (2026-08-08, sin aviso Node 20) |
| 3 | Alcance o2 aceptado (hooks, no canvas) | x |

**Cerrado 2026-08-08** — F8-CI + oleada 2 aprobados.
