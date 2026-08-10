# Roadmap — Work planes / referencias espaciales

## Estado

| Corte | Estado | Gate |
|-------|--------|------|
| **WP-v1** Storey → Workplane compartido | **cerrada** 2026-08-09 | Tools usan workplane; no cámara |
| **WP-v2** Planos tangibles | **cerrada** 2026-08-09 | Nivel · superficie · línea; overlay; sesión |
| **SK-v1** Sketch Mode (rectángulo) | **cerrada** 2026-08-09 | Solo paramétrico sobre Workplane |
| **SK-sel** Sketch sobre selección | **cerrada** 2026-08-09 | Doble clic / Editar perfil (muro) |
| **SK-profile** Perfil abstracto | **cerrada** 2026-08-09 | Perímetro editable; SK-replace v0 |
| **SK-profile-one** | **cerrada** 2026-08-10 | Anti N muros; ver `sketch-result-outline.md` |
| **SK-wall-profile-v1** | **cerrada** 2026-08-10 | Bloques 0–7; `.axon` v2 |
| **SK-draw** Dibujar completo | **cerrada** 2026-08-09 | Línea/rect/arcos/pick |
| Edit Mode / Family Editor / Push&Pull | **parked** | Auth aparte |
| Planos inclinados 3 pts / persistencia `.axon` | **parked** | Auth + ADR |

Prerrequisito LR2+LR3: **cumplido**.

## Flujo

```
Storey → SpatialReferenceContext → Workplane (nivel | superficie | línea)
  → Parametric Edit | Sketch Mode | hosted tools
```

**Workplane es la base** de Sketch / emplazamiento. En planta el activo por
defecto es el **nivel**. Superficies (cara de muro) y planos por línea son
overrides de **sesión** (no SoT en `.axon`).

## WP-v1 (hecho)

| Pieza | API | Notas |
|-------|-----|-------|
| Workplane nivel | `workplaneFromStorey` | Horizontal z = elevation |
| SpatialReferenceContext | `resolveSpatialReference` | `{ storeyId, workplane }` |
| Proyección | `projectPointOntoWorkplane`, `pointOnWorkplaneXY` | Dominio puro |

## WP-v2 (hecho — tangibles)

| Concepto | API / UI | Notas |
|----------|----------|-------|
| Nivel | `kind: "storey"` · **Nivel** | Default planta; al cambiar storey se restaura |
| Superficie | `workplaneFromWallFace` · **Seleccionar** | Arquitectura (siempre) + Modificar si hay geometría |
| Plano por línea | `workplaneFromLineTrace` · **Dibujar** | Solo **Arquitectura**; 2 clics → vertical |
| Sesión | `activeWorkplane`, `workplaneLock` | No en `.axon` |
| Overlay | `setWorkplaneOverlay` / `setWorkplaneTrace` | Parche + ejes U/V |
| Pick | `pickWorkplane` | Ray ∩ plano activo (no solo z nivel) |

Invariantes:

- No acoplar herramientas a la cámara.
- Workplane **no** es segunda SoT en documento.
- Parametric / Sketch / Edit **no** comparten reglas de edición (solo referencia espacial).
- Muros se confirman en el **plano del nivel** del `storeyId` del workplane activo.

**No reutilizado del Desktop:** Godot planes, RPC, planos por malla triangulada.

## Fuera de WP-v2 (auth aparte)

- Planos inclinados por 3 puntos
- Persistencia de workplane en `AxonDocument`
- Reference Surfaces universales (no solo cara de muro)
- Family Editor · Push & Pull · Edit Mode

## Informe mínimo por cambio futuro

Problema · datos · invariantes · componentes · tests · qué del Desktop **no** se reutiliza.
