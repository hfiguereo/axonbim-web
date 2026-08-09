# Roadmap — Work planes / referencias espaciales

## Estado

| Corte | Estado | Gate |
|-------|--------|------|
| **WP-v1** Storey → Workplane compartido | **cerrada** 2026-08-09 | Tools usan `resolveSpatialReference` / workplane; no cámara |
| Sketch Mode / Edit Mode / Family Editor / Push&Pull | **parked** | Auth aparte tras WP-v1 |
| Planos custom / reference surfaces universales | **parked** | Auth aparte |

Prerrequisito LR2+LR3: **cumplido**.

## Flujo

```
Storey → SpatialReferenceContext → Workplane
  → Parametric Edit (hoy) | Sketch Mode | Edit Mode   ← modos no mezclan reglas
```

## WP-v1 (hecho)

Problema: cada tool leía elevación/storey a mano; no había plano compartido.

| Pieza | API | Notas |
|-------|-----|-------|
| Workplane | `workplaneFromStorey`, `getActiveWorkplane` | Horizontal en z = elevation |
| SpatialReferenceContext | `resolveSpatialReference` | `{ storeyId, workplane }` |
| Proyección | `projectPointOntoWorkplane`, `pointOnWorkplaneXY` | Dominio puro |
| Consumo | session muro + Viewport pick z | Sin persistir workplane en `.axon` |

Invariantes:

- No acoplar herramientas a la cámara.
- Workplane **derivado** (no segunda SoT en documento).
- Parametric / Sketch / Edit **no** comparten reglas de edición (solo referencia espacial).

**No reutilizado del Desktop:** Godot planes, RPC, planos por malla triangulada.

## Fuera de WP-v1 (no implementar sin auth)

- Family Editor · Push & Pull · Reference Surfaces universales
- Sketch Mode / Edit Mode completos
- Workplanes inclinados o fijados por el usuario
- Persistencia de workplane en `AxonDocument`

## Informe mínimo por cambio futuro

Problema · datos · invariantes · componentes · tests · qué del Desktop **no** se reutiliza.
