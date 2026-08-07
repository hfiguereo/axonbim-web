# ADR 0008 — Esquinas de muro por extensión de eje (sin booleanas)

## Estado

Aceptado (MVP)

## Contexto

Con muros caja centrados en el eje, dos segmentos encadenados que comparten un vértice dejan un **hueco en la esquina exterior** (corte perpendicular al eje en cada extremo). Un kernel CAD / unión booleana está fuera del MVP ([ADR 0004](0004-no-cad-kernel-in-mvp.md)).

La **cadena** solo controla el gesto (P2 → P1 del siguiente); no altera la malla.

## Decisión

1. Los `p1`/`p2` paramétricos del documento **no se alargan**.
2. En derivación de malla (`wallBoxMesh`), si dos o más muros comparten un extremo (clave XY a mm), cada extremo unido se **extiende** `thickness/2` a lo largo del eje.
3. `computeWallJoinExtensions` calcula `extendStart` / `extendEnd` por muro; planta y 3D usan la misma derivación.
4. Solapamiento en la esquina interior es aceptable en MVP (material opaco).

## Consecuencias

- Esquinas L rellenas sin booleanas.
- Tests Vitest cubren extensión en L.
- Uniones en T también extienden (posible solape mayor; OK en MVP).
- Miters angulares finos y uniones por capa quedan post-MVP.
