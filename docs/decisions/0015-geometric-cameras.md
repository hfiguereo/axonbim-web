# ADR 0015 — Cámaras geométricas (vista 3D ligada)

## Estado

Aceptado (autorizado 2026-08-08) — corte mínimo.  
**Aprobado en producto 2026-08-08** (validación humana).

## Contexto

La cinta Vista tenía **Cámara** como maqueta. Se necesita una cámara de modelo (no render) colocable en planta, con vista 3D propia e independiente de la perspectiva isométrica base.

## Decisión

1. Entidad `Camera` en `AxonDocument`: `id`, `name`, `eye` (Vec3), `target` (Vec3), `fov` (grados, vertical). Solo geometría de vista.
2. Colocación en **planta**: clic 1 = ojo (altura por defecto 1.7 m), clic 2 = punto de mira (misma Z de ojo o suelo+1.7 según tool).
3. Al crear: comando + vista de sesión `kind: "camera"` con `cameraId`, visible en el navegador bajo **Cámaras / 3D**.
4. Vista cámara: proyección perspectiva desde `eye`→`target`+`fov`. La **Perspectiva 3D** base no lleva `cameraId` (órbita libre).
5. Símbolo en planta (triángulo/cono de visión). Props editables: nombre, eye Z (altura), FOV, target XY.
6. Persistencia en `.axon` v1 (`cameras[]`). Sin materiales ni render.

## Fuera de este corte

Path de cámara · animación · render · grips de FOV ricos · sincronizar gizmo con cámaras · secciones.

## Relacionado

Región de recorte de vista (`Camera.crop` / viewport): ADR 0016.
