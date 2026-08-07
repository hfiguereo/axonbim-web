# ADR 0006 — Cambios de agente controlados

## Estado

Aceptado

## Contexto

Los agentes tienden a expandir alcance, refactorizar sin pedido y alucinar APIs.

## Decisión

- Alcance explícito por tarea
- Presupuesto orientativo: pocos archivos; docs solo si cambia contrato
- Sin expansión silenciosa ni refactor de riesgo sin plan autorizado (“Sí, autoriza este plan”)
- Evidencia antes de “arreglar” fallos runtime
- Detenerse al cumplir el objetivo y en cada gate de fase
- Reglas Cursor cortas; detalle en `docs/`

## Consecuencias

- `.cursor/rules/` unificadas
- `AGENTS.md` como índice
- Gates en `docs/roadmap/gates.md`
