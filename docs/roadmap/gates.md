# Gates — paradas de evaluación

El agente y el desarrollo humano **se detienen** en cada gate. “Continúa con el proyecto” no autoriza saltarse un gate ni refactorizaciones de riesgo.

| Gate | Tras | Pregunta de salida | Siguiente solo si |
|------|------|--------------------|-------------------|
| **G-F0** | Fundación docs + rules | ¿Alcance MVP y rules sin inflación? | Autorias F1 cerrado o Etapa 0 |
| **G-F1** | Contratos de dominio | ¿Coords, documento, comandos, `.axon`, inventario OK? | Autorizas **Etapa 0 (código)** |
| **G-E0** | App abrible | ¿Layout/navegación útiles? | Autorizas Etapa 1 |
| **G-E1** | Primer muro | ¿Corte vertical usable? | Autorizas MVP estricto |
| **G-MVP** | MVP estricto | ¿Sensación de dibujo, claridad, utilidad? | Autorizas post-MVP (puertas/etc.) |

## Estado actual

- **G-F0 / G-F1 / G-E0 / G-E1 / G-MVP:** **aprobados** (2026-08-06)
- **MVP estricto:** cerrado — muro dibujable, snap, inglete, demo, zoom, Fit, gizmo maqueta
- **Post-MVP:** **bloqueado** hasta autorización explícita (puertas/ventanas, gizmo→cámaras reales, etc.)
- **Opcional pendiente:** pruebas visuales Playwright (no bloquean G-MVP)
- **GitHub:** https://github.com/hfiguereo/axonbim-web

## Registro de aprobación

| Gate | Fecha | Decisión | Notas |
|------|-------|----------|-------|
| G-F0 | 2026-08-06 | aprobado | Autorización Etapa 0 |
| G-F1 | 2026-08-06 | aprobado | Autorización Etapa 0 |
| G-E0 | 2026-08-06 | aprobado | Base UI: cinta, Modificar/Dibujar/Cadena, compositor L/R |
| G-E1 | 2026-08-06 | aprobado | Primer muro usable; autoriza MVP estricto |
| G-MVP | 2026-08-06 | aprobado | Validación humana: dibujo claro y útil; no autoriza post-MVP aún |
