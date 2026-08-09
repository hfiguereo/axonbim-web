# ADR 0009 — Snap de muro y conmutadores en barra de estado

## Estado

Aceptado (MVP)

## Contexto

El snap (extremos, ortogonal, cierre de cadena) es parte del alcance MVP. Debe ser **visible** al dibujar y **apagable** sin salir de la herramienta Muro. La cinta ya tiene Cadena; el estado vivo conviene en la barra inferior.

## Decisión

1. Snap en `@axonbim/tools` (`snapWallPoint`): prioridad cierre → extremo → orto (**Shift** fuerza orto).
2. **LR1 (2026-08-09):** `SnapSession` con histéresis de eje — entrar orto a ~12°, mantener hasta ~22°; estado solo en session/tools, **nunca** en `AxonDocument` / historial. Esc / fin de herramienta / nuevo segmento limpian la sesión.
3. Feedback en el visor: cruz + color de preview (azul extremo, verde orto, dorado cierre) + etiqueta en hint / `snap:` en status.
4. `snapEnabled` (default on) conmutable con switch en la barra de estado. **Cadena** no se duplica ahí: vive solo en Modificar / opciones de herramienta.
5. Con snap off, el cursor usa coordenadas libres; la cadena sigue independiente.

## Consecuencias

- UX de dibujo comprensible sin depender solo del status textual.
- Sin oscilación libre ↔ orto en la banda de mantenimiento.
- Tolerancia de extremo/cierre usable en planta (~0.2 m hit) además de `SNAP_TOLERANCE` documental.
- Playwright / pruebas visuales siguen pendientes en la matriz de aceptación.
- **LR1-C (parked):** midpoint / perpendicular / más proyecciones — ver
  [`legacy-reuse-roadmap.md`](../roadmap/legacy-reuse-roadmap.md) §LR1-C. No ampliar
  precedencia hasta auth explícita.
