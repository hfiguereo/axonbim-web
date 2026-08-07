# ADR 0009 — Snap de muro y conmutadores en barra de estado

## Estado

Aceptado (MVP)

## Contexto

El snap (extremos, ortogonal, cierre de cadena) es parte del alcance MVP. Debe ser **visible** al dibujar y **apagable** sin salir de la herramienta Muro. La cinta ya tiene Cadena; el estado vivo conviene en la barra inferior.

## Decisión

1. Snap en `@axonbim/tools` (`snapWallPoint`): prioridad cierre → extremo → orto (ángulo ~12° o cerca de eje; **Shift** fuerza orto).
2. Feedback en el visor: cruz + color de preview (azul extremo, verde orto, dorado cierre) + etiqueta en hint / `snap:` en status.
3. `snapEnabled` (default on) conmutable con switch en la barra de estado. **Cadena** no se duplica ahí: vive solo en Modificar / opciones de herramienta.
4. Con snap off, el cursor usa coordenadas libres; la cadena sigue independiente.

## Consecuencias

- UX de dibujo comprensible sin depender solo del status textual.
- Tolerancia de extremo/cierre usable en planta (~0.2 m hit) además de `SNAP_TOLERANCE` documental.
- Playwright / pruebas visuales siguen pendientes en la matriz de aceptación.
