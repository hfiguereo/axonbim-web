# ADR 0011 — Ventanas: segundo corte post-MVP

## Estado

Aceptado (autorizado 2026-08-07)

## Contexto

Corte de puertas (ADR 0010) entregado. Se autoriza **ventana** como siguiente hosted opening, reutilizando hueco en muro, grips de planta y familia en caliente.

## Secuencia acordada (post-puertas)

1. **Ventanas** (este ADR)
2. **Gizmo → cámaras reales** (Top/Front/… de verdad)
3. **Playwright** (pruebas visuales; cierre de calidad — no es “feature post-MVP”, es calidad)

## Decisión

1. Entidad `Window` en `AxonDocument` (`windows`), host `wallId`.
2. Posición: `centerOffset`, `width`, `height`, `sill` (típicamente ~0.9 m), `hinge`, `swing`, `leafState`.
3. Hueco: misma unión de slabs que puertas (`openingsFromHosted`).
4. Ensamblaje: marco completo (**jambas + dintel + antepecho/sill** — a diferencia de puerta), hoja/vidrio, herrajes simples.
5. Planta: símbolo de vano (líneas en el espesor) + arco si abatible; grips `PlanFlipControl` (`entityType: "window"`).
6. Herramienta Ventana → clic en muro → `window.create`; familia en caliente.
7. `.axon` v1: `windows` / `windowFamilies` opcionales.
8. Borrar muro borra sus ventanas.

## Fuera de este corte

IFC · gizmo→cámaras · Playwright · editor de familia rico · rango de vista.
