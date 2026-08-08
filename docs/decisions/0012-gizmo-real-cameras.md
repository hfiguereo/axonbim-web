# ADR 0012 — Gizmo → cámaras reales

## Estado

Aceptado (autorizado 2026-08-07; cola post-ventanas)

## Contexto

El `ViewOrientationGizmo` era maqueta (spin + status). Tras puertas/ventanas se autoriza enlazarlo a la cámara del viewport 3D.

## Decisión

1. Presets: `top` | `bottom` | `front` | `back` | `left` | `right` | `iso`.
2. Clic en ejes del gizmo (vista perspectiva):
   - **Z** → top · **Y** → front · **X** → right
   - **Hub** → iso
3. `ViewportHandle.setCameraPreset` mueve la cámara perspectiva manteniendo distancia al target de orbit.
4. Planta ortogonal sigue siendo la pestaña Planta (no se fuerza desde el gizmo).
5. Orbit / zoom / pan existentes se conservan tras el preset.

## Fuera de este corte

View Cube completo con caras negativas dedicadas · animación tween · Playwright.
