# ADR 0003 — IFC como adaptador de intercambio

## Estado

Aceptado (implementación aplazada)

## Contexto

El desktop mutaba semántica IFC durante el modelado, anticipando complejidad.

## Decisión

IFC no es el runtime del gesto ni la SoT del MVP. Será un **adaptador de import/export** cuando el producto lo autorice.

## Consecuencias

- MVP sin dependencia IfcOpenShell/wasm IFC
- Formato propio `.axon` v1 para persistencia
- Cualquier trabajo IFC requiere alcance explícito post-MVP
