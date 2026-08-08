# Refactor controlado — sessionStore / viewer

## Autorización

**2026-08-08** — dueño: refactor controlado · cortes 1–4.

## Principio

Microcortes con comportamiento idéntico. Tras cada corte: `pnpm test` + `pnpm test:e2e`.  
No reescribir `sessionStore` ni `createViewport` de un golpe. No IFC/OCCT/workplanes.

## Corte 1 (**hecho**) — resolución de crop

- `viewCropResolve.ts` + 6 tests

## Corte 2 (**hecho**) — drag de crop

- `viewCropDrag.ts` + 6 tests

## Corte 3 (**hecho** 2026-08-08) — tipos de sesión

- `session/sessionTypes.ts`: `ProjectView`, docks, ribbon, estilos, orbit, constantes de cámara
- `sessionStore` reexporta por compatibilidad; UI importa tipos desde `sessionTypes`

## Corte 4 (**hecho** 2026-08-08) — clip/máscara del viewer

- `packages/viewer/src/viewCropClip.ts`: planos GPU, máscara de planta, `applyViewCropClipping`
- `viewCropClip.test.ts` (2) — ecuaciones AABB → planos
- `createViewport` delega clip/máscara; vitest en `@axonbim/viewer`

## Parada

Cortes 1–4 cerrados. Corte 5 **no** sin OK explícito.

## Siguiente (requiere OK)

| # | Idea |
|---|------|
| 5 | (proponer) más extracción de `createViewport` o peels de `sessionStore` |
