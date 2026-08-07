# Visión — AxonBIM Web

## Propósito

Ofrecer modelado BIM en el navegador con la fluidez de un trazado directo y el rigor de un documento paramétrico, empezando por una herramienta pequeña que un arquitecto pueda **ver, probar y juzgar** sin leer código.

## Principio de producto

> Primero una experiencia arquitectónica pequeña, visible y convincente. Después complejidad.

## Relación con AxonBIM desktop

El desktop (Godot + Python) demostró ideas válidas: modelo autoritativo, geometría analítica, muros caja, historial reversible. También acumuló demasiada infraestructura (RPC, dos procesos, IFC temprano).

AxonBIM Web **no migra ese código**. Reconstruye el producto sobre comportamientos validados, en un solo entorno TypeScript local-first.

## Experiencia objetivo (MVP)

- Abrir un proyecto vacío o una vivienda demo de muros
- Dibujar muros encadenados con snapping básico
- Seleccionar, editar altura/espesor/familia, deshacer
- Ver planta y perspectiva coherentes con el mismo modelo
- Guardar y reabrir en formato propio `.axon`

## Fuera de la visión inmediata

Competir con Revit completo, MEP, worksharing, render fotorrealista o entrega normativa MIVED en el primer ciclo.
