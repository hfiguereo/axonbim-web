# ADR 0016 — Región de recorte de vista (Crop Region)

## Estado

Aceptado (autorizado 2026-08-08) — corte mínimo.  
**Aprobado en producto 2026-08-08** (validación humana).  
Ajuste 2026-08-08: **clip por vista**; planta y cámara independientes; marco seleccionable en planta.

## Contexto

Las cámaras geométricas (ADR 0015) y las vistas de sesión necesitan limitar lo visible con un **marco de recorte**, inspirado en el recorte de vista de productos de referencia BIM.

## Decisión

1. Tipo compartido `ViewCrop`: AABB en world XY (+ Z opcional).
2. **Cámara (documento):** `Camera.crop` — persiste en `.axon`; default on al crear.
3. **Vistas de sesión** (planta / perspectiva base): `ProjectView.crop` — sesión; default off. Independiente del crop de cada cámara.
4. **Clipping (oculta geometría) — solo la vista activa:**
   - Vista **planta** o **perspectiva** libre → `ProjectView.crop` de esa vista.
   - Vista **cámara** → `Camera.crop` de esa entidad.
   - **Nunca** se aplica `Camera.crop` como clip de la planta.
5. **Representación en planta de una cámara:** cono + marco de `Camera.crop` si la cámara está seleccionada. **Seleccionar el marco** activa grips y permite arrastrarlo para mover cámara+crop juntos (solo crop de cámara).
6. **Clip en planta (sesión):** planos GPU + máscara fuera del AABB.
7. Vista cámara / 3D con crop: marco en pantalla + clip de la vista activa.
8. UI: bloque Viewport sin selección; con cámara seleccionada edita `Camera.crop`.

## Nota de producto — marcos editables (2026-08-08)

El dueño **confirma** que los marcos de recorte deben ser **cliqueables y modificables**
para personalizar la presentación: no son decoración, son el control de encuadre.
Esto refuerza el punto 5 (marco seleccionable + grips) como requisito, no como extra.

Consecuencia técnica detectada en el corte 7b del refactor: la tolerancia de clic
del **marco** era de 12 px, la **más estrecha** de la app (entidad 14, grip de crop 14,
control de flip 16), y además el marco es geometría de **línea fina**. Es decir: lo que
más se necesita agarrar era lo más difícil de acertar.

**Decisión del dueño (2026-08-08): subir el marco a 16 px**, igualando al control más
generoso. Queda como invariante con prueba: la tolerancia del marco **no** puede ser más
estrecha que la de selección de entidades. Constantes en
`packages/viewer/src/pickTolerance.ts`; el resto de umbrales se dejan como están.

## Fuera de este corte

Crop rotado · annotation crop · caja de sección 3D · sync animado · path de cámara · grips NDC en la vista cámara.
