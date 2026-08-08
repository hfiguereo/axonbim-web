# Gobernanza documental (política adaptada)

Complementa `AGENTS.md`. Detalle de proceso: no inventar contratos documentados.

## Obligaciones del agente

1. Antes de cambios materiales: consultar `AGENTS.md` + docs/ADR del índice aplicables.
2. Si el comportamiento ya está documentado: usarlo; apartarse solo con justificación (insuficiente / contradictorio / obsoleto).
3. Si código, tests, docs o ADR discrepan: señalar la discrepancia antes de cambiar arquitectura. En tramos con muchas decisiones, validar de forma **estricta** los factores críticos de ADR 0006 / gates **antes** de cerrar — aunque el dueño apresure.
4. Documentación permanente nueva/movida/renombrada/eliminada → actualizar el índice en la misma tarea.
5. Rules cortas; detalle en `docs/`.
6. En docs y UI visible: no nombrar marcas de terceros; usar **producto(s) de referencia** o **inspirado en** cuando haga falta aludir a hábitos de software BIM comercial.

## Índice vivo

El índice oficial es la tabla de `AGENTS.md` («Índice de lectura»). Mantenerla coherente.

## No hacer

Duplicar contratos en `.cursor/rules` · docs paralelos que compitan sin declarar relación · declarar obsoleto un ADR solo porque el código difiere.
