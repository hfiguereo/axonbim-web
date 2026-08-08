# Refactor controlado — sessionStore / viewer

## Autorización

**2026-08-08** — dueño: refactor controlado · corte 2 · **corte 3**.

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

## Parada

Cortes 1–3 cerrados. Corte 4 **no** sin OK explícito.

## Siguiente (requiere OK)

| # | Idea |
|---|------|
| 4 | Primer corte viewer: clip/máscara fuera de `createViewport` |
