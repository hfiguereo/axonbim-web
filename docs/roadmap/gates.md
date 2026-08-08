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

- **G-MVP:** **aprobado** (2026-08-06)
## Estado actual

- **G-MVP:** aprobado (2026-08-06)
- **Post-MVP código:** puertas (0010), ventanas (0011), gizmo→cámaras (0012) en rama
- **Fase activa: F5-S estabilización** — IDs, historial no-op, parser `.axon`, tests (incluye ventanas). Ver `f5-stabilization.md`
- **Parked:** paradigmas/workplanes, OCCT (ADR 0013)
- **Cola tras F5-S + validación humana:** Playwright (calidad)
- **GitHub:** https://github.com/hfiguereo/axonbim-web

## Registro de aprobación

| Gate | Fecha | Decisión | Notas |
|------|-------|----------|-------|
| G-F0 | 2026-08-06 | aprobado | Autorización Etapa 0 |
| G-F1 | 2026-08-06 | aprobado | Autorización Etapa 0 |
| G-E0 | 2026-08-06 | aprobado | Base UI |
| G-E1 | 2026-08-06 | aprobado | Primer muro |
| G-MVP | 2026-08-06 | aprobado | Dibujo usable |
| Post-MVP puertas | 2026-08-06 | autorizado | ADR 0010 |
| Post-MVP ventanas | 2026-08-07 | autorizado | ADR 0011 |
| Gizmo→cámaras | 2026-08-07 | autorizado | ADR 0012 |
| **F5-S** | 2026-08-07 | **autorizado** | Congelar features nuevas; estabilizar (A1+C ventanas) |
