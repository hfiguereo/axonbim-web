# ADR 0008 — Esquinas de muro por inglete (miter), sin booleanas

## Estado

Aceptado (MVP) — revisado 2026-08-06 (reemplaza extensión burda con solape)

## Contexto

Con muros caja centrados en el eje, dos segmentos que comparten un vértice dejan un hueco exterior si el corte es perpendicular. Extender el eje `thickness/2` rellena el hueco pero **solapa** en la esquina (aspecto burdo). Uniones booleanas quedan fuera del MVP ([ADR 0004](0004-no-cad-kernel-in-mvp.md)).

## Decisión

1. `p1`/`p2` paramétricos **no** se mutan.
2. En extremos con **exactamente dos** muros (unión L), la malla usa **inglete**: esquinas left/right = intersección de offset a `thickness/2` (`miterCorners` / `computeWallJoinDirs`).
3. Valence ≠ 2 (T y peores): extremo cuadrado (sin inglete ambiguo).
4. Misma derivación para planta y 3D.

## Consecuencias

- Esquina limpia en L (punta exterior compartida, sin losa de solape).
- Ángulos muy agudos limitan la longitud de inglete (anti-spike).
- T contra el lado de un muro largo (no extremo) sigue sin join automático — fuera de este ADR.
