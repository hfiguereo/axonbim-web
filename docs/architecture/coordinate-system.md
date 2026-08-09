# Sistema de coordenadas y tolerancias

Contrato F1. Aplicable al dominio y a las vistas.

## Unidades

- Unidad interna: **metro**
- Ángulos: **radianes** en dominio; la UI puede mostrar grados
- Espesores de familia del MVP: 0.10 m, 0.15 m, 0.20 m

## Ejes

| Eje | Significado |
|-----|-------------|
| **+X** | Este / derecha en planta |
| **+Y** | **Project North** / arriba en planta |
| **+Z** | Arriba (altura del edificio) |

Sistema **diestro**. La planta se proyecta sobre **XY** (Z constante del nivel activo).
Rotación de Project North: **fuera de este corte** (LR3-D v1).

## Origen y niveles

- Origen del documento: `(0, 0, 0)` salvo que el proyecto defina otro (MVP: origen fijo en 0).
- Niveles: `Storey[]` en el documento; contexto de sesión `activeStoreyId` (LR3-A).
- Las tools **no** leen `storeys[0]` directo — usan `getActiveStorey` / reconciliación.
- Datums de nivel (LR3-B): derivados para UI; no son segunda SoT.
- La base de un muro usa `z` ≈ elevación del storey activo.

## Projection Basis (LR3-D)

Contrato formal en `@axonbim/model` (`getProjectionBasis`): TOP / NORTH / SOUTH / EAST / WEST
con `eyeOffset`, `up`, `axisU`, `axisV` y enlace al preset del gizmo (`cameraPreset`).
Misma basis para Viewer hoy y Technical Views / DXF / PDF después (LR4).

## Plano de trazado (Workplane WP-v1)

Las herramientas de muro trabajan sobre el **Workplane** activo: plano horizontal
derivado del storey (`resolveSpatialReference` / `getActiveWorkplane`).
Cambiar de vista (planta ↔ perspectiva) **no** cambia el modelo ni el workplane.
El workplane **no** se persiste en `.axon` (estado derivado de sesión + storeys).

## Tolerancias

| Símbolo | Valor | Uso |
|---------|-------|-----|
| `EPS_LENGTH` | `1e-6` m | Igualdad de longitudes / coincidencia de puntos |
| `EPS_AREA` | `1e-9` m² | Comparaciones de área |
| `MIN_WALL_LENGTH` | `0.05` m | Longitud mínima de eje p1–p2 |
| `MIN_THICKNESS` | `0.05` m | Espesor mínimo |
| `MIN_HEIGHT` | `0.05` m | Altura mínima |
| `SNAP_TOLERANCE` | `0.05` m | Snap a extremos / ortogonal en pantalla→mundo (ajustable en UI después) |

Valores por debajo de mínimos → rechazo de comando con error explícito (no silencios).

## Equivalencia numérica en tests

Dos longitudes/coordenadas se consideran iguales si `|a - b| <= EPS_LENGTH`.  
No se exige identidad bit a bit con mallas del desktop.
