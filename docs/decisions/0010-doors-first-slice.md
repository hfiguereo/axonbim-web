# ADR 0010 — Puertas: primer corte post-MVP

## Estado

Aceptado (autorizado 2026-08-06)

## Contexto

G-MVP cerrado. Se autoriza el primer corte post-MVP: **puerta** usable de punta a punta, sin ventanas ni IFC.

## Decisión

1. Entidad `Door` en `AxonDocument` (array `doors`), referenciada a `wallId`.
2. Posición: `centerOffset` (m) a lo largo del eje del muro desde `p1`; `width`, `height`, `sill`, `hinge`, `swing`.
3. Hueco: malla de muro reconstruida por **unión de cajas** alrededor del hueco (sin OpenCascade).
4. Hoja: ensamblaje (marco + hoja + herrajes); ángulo según `leafState` (abierta 90° por defecto).
5. Planta: símbolo arco + **grips de orientación** (`PlanFlipControl`: swing / hinge) reutilizables para futuros elementos.
6. Colocación: herramienta Puerta → clic en muro → proyectar al eje → `door.create`; familia editable en caliente.
7. `.axon` v1 admite `doors` opcional (default `[]`) para compatibilidad; `swing` default `positive`.
8. Borrar muro borra sus puertas.

## Fuera de este corte

Ventanas · editor de familia rico · swing animado continuo · host caps · **rango de vista / corte de planta** · IFC openings.
