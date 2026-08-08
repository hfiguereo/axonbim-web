# Gobernanza documental (política adaptada)

Complementa `AGENTS.md`. Detalle de proceso: no inventar contratos documentados.

## Obligaciones del agente

1. Antes de cambios materiales: consultar `AGENTS.md` + docs/ADR del índice aplicables.
2. Si el comportamiento ya está documentado: usarlo; apartarse solo con justificación (insuficiente / contradictorio / obsoleto).
3. Si código, tests, docs o ADR discrepan: señalar la discrepancia antes de cambiar arquitectura.
4. Documentación permanente nueva/movida/renombrada/eliminada → actualizar el índice en la misma tarea.
5. Rules cortas; detalle en `docs/`.

## Índice vivo

El índice oficial es la tabla de `AGENTS.md` («Índice de lectura»). Mantenerla coherente.

## No hacer

Duplicar contratos en `.cursor/rules` · docs paralelos que compitan sin declarar relación · declarar obsoleto un ADR solo porque el código difiere.
