# ADR 0012 — Gizmo → cámaras reales

## Estado

Aceptado (autorizado 2026-08-07; cola post-ventanas). **Ampliado por [ADR 0014](0014-view-cube-orbit-pivot.md)** (tríada ±ejes, ortho 3D, pivot, hold-orbit).

## Contexto

El `ViewOrientationGizmo` era maqueta (spin + status). Tras puertas/ventanas se autoriza enlazarlo a la cámara del viewport 3D.

## Decisión (original)

1. Presets: `top` | `bottom` | `front` | `back` | `left` | `right` | `iso`.
2. Clic en ejes del gizmo (vista perspectiva):
   - **Z** → top · **Y** → front · **X** → right
   - **Hub** → iso
3. `ViewportHandle.setCameraPreset` mueve la cámara manteniendo distancia al target de orbit.
4. Planta ortogonal sigue siendo la pestaña Planta (no se fuerza desde el gizmo).
5. Orbit / zoom / pan existentes se conservan tras el preset.

## Fuera del corte 0012 (parcialmente cerrado en 0014)

Tips negativos (±ejes) · proyección ortho en vistas no-iso · pivot selección · hold-orbit en gizmo — ver ADR 0014.  
Sigue fuera: animación tween · sync gizmo↔cámara.
