# Política de geometría

## Enfoque

Geometría **analítica especializada** para elementos arquitectónicos simples (muros caja en el MVP).  
No es un kernel CAD general. OpenCascade y B-Rep booleanas quedan fuera del MVP ([ADR 0004](../decisions/0004-no-cad-kernel-in-mvp.md)).

## Pipeline

```
Wall (paramétrico) → reglas geométricas → MeshBuffer / OrthoEdges → viewer
```

Una sola derivación alimenta **planta** y **3D**. Prohibido mantener dos verdades geométricas divergentes.

## Muro caja (MVP)

Oráculo de comportamiento (legado `wall_box_mesh`, reimplementar en TS):

1. Eje = segmento `(p1.x, p1.y)` → `(p2.x, p2.y)`.
2. Dirección unitaria del eje; normal horizontal perpendicular en XY.
3. Contorno en planta: rectángulo de ancho `thickness` centrado en el eje.
4. Extrusión en +Z de altura `height` desde `z0 = min(p1.z, p2.z)`.
5. Malla: prisma cerrado (vértices + índices de triángulos + normales).

### Uniones en esquina (MVP)

Si **exactamente dos** muros comparten un extremo, la malla usa **inglete** (`miterCorners` vía `computeWallJoinDirs`) — corte diagonal limpio, sin solape de losa. Los `p1`/`p2` del documento no cambian. Ver [ADR 0008](../decisions/0008-wall-corner-join-extension.md).

Sin booleanas / OpenCascade.
## Equivalencia geométrica vs desktop

No se exige:

- Mismos índices de triángulos
- Mismo winding idéntico al Godot
- Mismos GUID IFC

Sí se exige (tolerancias en [coordinate-system.md](coordinate-system.md)):

| Invariante | Criterio |
|------------|----------|
| Longitud de eje | `‖p2xy - p1xy‖` |
| Altura | `height` |
| Espesor | `thickness` |
| BBox mundo | Coincide dentro de `EPS_LENGTH` en cada eje |
| Volumen del prisma | `length * thickness * height` dentro de tolerancia relativa razonable (`1e-6` relativo o `EPS_AREA * height`) |
| Centroide en planta | Punto medio del eje ± `EPS_LENGTH` |

Los tests nuevos en Vitest deben expresar estos oráculos; no portar archivos pytest.

## Preview vs confirmado

- Preview de herramienta: geometría temporal **fuera** del documento y del historial.
- Confirmación: comando crea/actualiza `Wall` y regenera representación.

## Post-MVP (referencia, no implementar)

Huecos, losas, extrusión de cara (Push/Pull), booleanas — requieren ficha en inventario + ADR + autorización.
