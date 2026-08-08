# F8 — Playwright oleada 1 (**aprobado** 2026-08-08)

## Autorización / cierre

| Punto | Decisión |
|-------|----------|
| 1 Alcance | **Estrecho** (humo; no dibujo canvas / grips / gizmo) |
| 2 Tipo | **A + B** — comportamiento y capturas UI |
| 3 Dónde | **Solo local** (`pnpm test:e2e`) — CI no incluido aún |
| 4 Fuera | IFC · OCCT · workplanes · PWA · refactor `sessionStore` |
| **Cierre humano** | **2026-08-08** — checklist 1–5 OK (`pnpm test:e2e` verde + validación en app) |

## Qué cubre

**A (funcional):** carga, Abrir demo, Nuevo, exportar/reabrir `.axon`, Deshacer tras borrar muro (hook `__AXON_E2E__` no-prod).

**B (visual):** screenshots full-page con **canvas enmascarado** (no comparamos píxeles WebGL). Baselines en `e2e/*-snapshots/`.

## Comandos

```bash
pnpm exec playwright install chromium   # una vez
# Si tienes `pnpm dev` en 5173, ciérralo antes (o deja que Playwright arranque el suyo)
pnpm test:e2e                           # correr
pnpm test:e2e:update                    # regenerar capturas B
```

Si falla con timeout en el menú Archivo: suele ser un Vite viejo en el puerto 5173. Cierra ese `dev` y vuelve a correr.
## Hooks UI

`data-testid`: `app-shell`, `file-menu`, `file-open-input`, `status-msg`, `status-meta`.

## Checklist humana — cierre F8 oleada 1

Marca **aprobado** en `gates.md` solo si esto cuadra. No incluye CI ni oleada 2.

| # | Qué ver / hacer | OK |
|---|-----------------|----|
| 1 | En el repo: `pnpm test:e2e` termina en verde (sin fallos) | x |
| 2 | Entiendes el alcance: humo de **Archivo/demo/undo**, **no** dibujo en canvas ni puerta/ventana/gizmo/cámara | x |
| 3 | Aceptas que las capturas B comparan **chrome UI** (canvas tapado), no la calidad del 3D | x |
| 4 | Aceptas **solo local** por ahora (no GitHub Actions) | x |
| 5 | Si algo del shell se ve raro en las PNG de `e2e/*-snapshots/`, lo dices antes de aprobar (o regeneras con `pnpm test:e2e:update` y revisas) | x |

**Fuera de este cierre:** F8-CI · F8 oleada 2 · IFC/OCCT/workplanes.

Cuando apruebes, dilo en el chat (p. ej. «apruebo F8 o1») y se actualiza el registro en `gates.md`.

**Cerrado 2026-08-08** — dueño: checklist 1–5 aprobado.