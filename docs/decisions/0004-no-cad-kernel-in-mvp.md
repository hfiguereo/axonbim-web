# ADR 0004 — Sin kernel CAD en el MVP

## Estado

Aceptado

## Contexto

Un kernel B-Rep (p. ej. OpenCascade) añade coste y superficie de fallo innecesarios para muros caja.

## Decisión

OpenCascade y B-Rep general **no** forman parte del MVP. Se usa geometría analítica especializada.

## Consecuencias

- Reglas explícitas para muros prisma
- Incorporación futura de kernel solo con problema concreto, análisis de coste, ADR y autorización
