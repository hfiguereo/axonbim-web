# Refactor controlado — sessionStore / viewer

## Autorización

**2026-08-08** — dueño: «autorizo el refactor controlado» · corte 2: «apruebo segundo corte».

## Principio

Microcortes con comportamiento idéntico. Tras cada corte: `pnpm test` + `pnpm test:e2e`.  
No reescribir `sessionStore` ni `createViewport` de un golpe. No IFC/OCCT/workplanes.

## Corte 1 (**hecho** 2026-08-08) — resolución de crop

- `viewCropResolve.ts` + 6 tests Vitest
- Verificación: unit + typecheck + e2e (9) verdes

## Corte 2 (**hecho** 2026-08-08) — drag de crop

- `viewCropDrag.ts`: `beginCornerCropDrag`, `beginCameraFrameMoveDrag`, `updateCropDragLive`, `resolveCropDragCommit`
- 6 tests Vitest
- `sessionStore` solo orquesta (set / applyCommand)
- Verificación: 12 unit + typecheck + e2e (9) verdes

## Parada

Cortes 1–2 cerrados. Cortes 3–4 **no** se encadenan sin OK explícito.

## Cortes siguientes (requieren OK explícito)

| # | Idea |
|---|------|
| 3 | Tipos tipos `ProjectView` / docks → `sessionTypes.ts` |
| 4 | Primer corte viewer: clip/máscara fuera de `createViewport` |
