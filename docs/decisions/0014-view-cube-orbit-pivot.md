# ADR 0014 — Gizmo de orientación, proyección 3D y pivot de órbita

## Estado

Aceptado (autorizado con plan gizmo/órbita/picking — 2026-08-08).  
Ampliado 2026-08-08: widget = **tríada ±ejes** (no cubo) + hold-to-orbit.  
**Aprobado en producto 2026-08-08** (validación humana).

## Contexto

ADR 0012 enlazó el gizmo a presets de cámara, pero el widget solo exponía +X/+Y/+Z, la vista 3D era siempre perspectiva, el pivot de órbita no seguía selección/modelo, y el picking fallaba con zoom lejano. Un View Cube de 6 caras cubría los sentidos negativos, pero la forma de cubo no encajaba con el hábito del gizmo de ejes.

## Decisión

1. **Gizmo tríada:** ejes con tips en ±X / ±Y / ±Z (6 presets orto) + hub central → iso perspectiva. Sin caras de cubo. Sin tween.
2. **Proyección 3D:** presets ≠ iso → cámara **ortográfica** 3D; **iso** → **perspectiva**. La pestaña Planta no se mezcla.
3. **Órbita:**
   - Clic medio/derecho en el lienzo (como antes).
   - **Hold (~180 ms) o arrastre** sobre el gizmo → `orbitByDelta` en el viewer (mismo pivot).
   - Clic corto en tip/hub → preset (sin órbita).
4. **Modos de pivot (sesión):** `model` | `selection`. Sin selección en modo selection → cae a centro de modelo.
5. **Picking:** umbral de línea escalado al zoom + pick por proximidad en pantalla si el rayo falla.

## Consecuencias

- Viewer mantiene `ortho` (planta), `persp` (iso 3D) y `ortho3d` (vistas orto 3D).
- `ViewportHandle.orbitByDelta` permite órbita desde el widget.
- Actualiza/complementa [0012](0012-gizmo-real-cameras.md).

## Fuera de este corte

Tween del gizmo · sync visual del widget con la cámara · órbita desde gizmo en vistas `kind: "camera"` · CI Playwright · IFC/OCCT.
