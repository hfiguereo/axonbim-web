# ADR 0013 — Geometry API propia; OCCT como candidato (parked)

## Estado

Aceptado como **criterio**, no como implementación (2026-08-07).

## Contexto

Preservar la posición frente a Open CASCADE: no adoptar ni descartar definitivamente. Complementa [0004](0004-no-cad-kernel-in-mvp.md).

## Decisión

1. El dominio BIM no depende de shapes de un kernel externo.
2. Se define (cuando haga falta) una **Axon Geometry API** (sketch/profile, transform, face/solid, operaciones aprobadas) detrás de la cual pueda haber backends.
3. OCCT solo se evalúa con necesidad demostrada (capacidad concreta + coste).
4. F5-S / ventanas / gizmo **no** abren OCCT.

## Consecuencias

Evita wrappers BIM→CAD prematuros; deja vía de adaptadores futuros sin reescribir el SoT.
