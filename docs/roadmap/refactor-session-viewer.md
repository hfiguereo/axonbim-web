# Refactor controlado — sessionStore / viewer

## Autorización

**2026-08-08** — dueño: «autorizo el refactor controlado».

## Principio

Microcortes con comportamiento idéntico. Tras cada corte: `pnpm test` + `pnpm test:e2e`.  
No reescribir `sessionStore` ni `createViewport` de un golpe. No IFC/OCCT/workplanes.

## Corte 1 (**hecho** 2026-08-08) — resolución de crop

**Qué:** sacar a módulo puro la lógica ADR 0016 de *qué crop se edita* vs *qué crop clipea*:

- `apps/web/src/session/viewCropResolve.ts`
- `defaultSessionViewCrop`
- `resolveActiveViewCrop`
- `resolveClippingCrop`
- Tests Vitest: `viewCropResolve.test.ts` (6)

**Verificación:** `pnpm --filter @axonbim/web test` + typecheck + `pnpm test:e2e` (9) verdes.

**Fuera de corte 1:** drag/commit de grips, split del store Zustand, tocado de `createViewport`.

## Parada

Corte 1 cerrado. Cortes 2–4 **no** se encadenan sin OK explícito.

## Cortes siguientes (requieren OK explícito)

| # | Idea |
|---|------|
| 2 | Helpers de drag crop (`begin`/`update`/`commit`) → módulo |
| 3 | Tipos tipos `ProjectView` / docks → `sessionTypes.ts` |
| 4 | Primer corte viewer: clip/máscara fuera de `createViewport` |
