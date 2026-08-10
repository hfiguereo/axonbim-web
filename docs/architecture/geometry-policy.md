# Política de geometría

## Enfoque

Geometría **analítica especializada** para elementos arquitectónicos (muros caja, huecos
hospedados, joins). No es un kernel CAD general. OpenCascade y B-Rep booleanas quedan
fuera del producto actual salvo ADR + autorización ([ADR 0004](../decisions/0004-no-cad-kernel-in-mvp.md),
[ADR 0013](../decisions/0013-geometry-api-occt-candidate.md) parked).

## Pipeline

```
Wall / Door / Window (paramétrico) → reglas geométricas → MeshBuffer / OrthoEdges → viewer
```

Una sola derivación alimenta **planta** y **3D**. Prohibido mantener dos verdades geométricas divergentes.

## Muro caja (núcleo)

Oráculo de comportamiento (legado `wall_box_mesh`, reimplementar en TS):

1. Eje = segmento `(p1.x, p1.y)` → `(p2.x, p2.y)`.
2. Dirección unitaria del eje; normal horizontal perpendicular en XY.
3. Contorno en planta: rectángulo de ancho `thickness` centrado en el eje.
4. Extrusión en +Z de altura `height` desde `z0 = min(p1.z, p2.z)`.
5. Malla: prisma cerrado (vértices + índices de triángulos + normales).

### Uniones en esquina

Si **exactamente dos** muros comparten un extremo, la malla usa **inglete** (`miterCorners` vía `computeWallJoinDirs`) — corte diagonal limpio, sin solape de losa. Los `p1`/`p2` del documento no cambian. Ver [ADR 0008](../decisions/0008-wall-corner-join-extension.md).

### Huecos hospedados (autorizados)

Puertas y ventanas recortan el muro anfitrión ([ADR 0010](../decisions/0010-doors-first-slice.md),
[ADR 0011](../decisions/0011-windows-slice.md)). Invariantes de cabida/solape en
`@axonbim/model` (`validateHostedOpening`, F9-E2); la malla (`wallMeshWithOpenings`)
asume huecos ya válidos.

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

## Contorno resultante (Sketch)

La silueta editable en Sketch Mode se deriva del **prisma muro caja** (no del eje solo)
y se proyecta sobre el Workplane activo. Contrato reutilizable:
[`sketch-result-outline.md`](sketch-result-outline.md). API: `outlineOnWorkplane` en
`@axonbim/geometry`.

## Preview vs confirmado

- Preview de herramienta: geometría temporal **fuera** del documento y del historial.
- Confirmación: comando crea/actualiza entidades y regenera representación.

## Referencia espacial (WP-v1)

El trazado usa un **Workplane** derivado del storey activo (`resolveSpatialReference` en
`@axonbim/model`). No es SoT en `.axon`. Detalle: [coordinate-system.md](coordinate-system.md),
[../roadmap/workplanes-roadmap.md](../roadmap/workplanes-roadmap.md).

## Parked / no implementar sin autorización

Losas, extrusión de cara (Push/Pull), booleanas de sólido, IFC operativo, Edit Mode,
arcos/pick sketch, planos custom / workplanes inclinados — requieren ficha + ADR + frase
explícita en chat. SK-v1 (rectángulo) ya cerrado. Ver
[../roadmap/pending-work.md](../roadmap/pending-work.md).
