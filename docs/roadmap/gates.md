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

- **G-F0 / G-F1:** aprobados (2026-08-06)
- **Etapa 0:** shell + maqueta UI Revit LT en `apps/web` — **base de interfaz futura** documentada en `docs/ui/interface-base.md`
- **G-E0:** **aprobado** (2026-08-06) — layout/compositor/cinta aceptados como base
- **Etapa 1:** hecha — corte vertical muro (G-E1)
- **MVP estricto:** **autorizado** (2026-08-06) — en curso (snap UI, joins, demo, Fit)
- **G-MVP:** pendiente (checklist casi completa; falta Playwright / tu OK de producto)
- **Docs vivas:** `CHANGELOG.md`, ADR 0008–0009, `acceptance-matrix.md`, `geometry-policy.md`
- **GitHub:** https://github.com/hfiguereo/axonbim-web
  - `main` en remoto: hasta Etapa 1 (`bc0ef5b`); cambios MVP aún locales hasta commit/push

## Registro de aprobación

| Gate | Fecha | Decisión | Notas |
|------|-------|----------|-------|
| G-F0 | 2026-08-06 | aprobado | Autorización Etapa 0 |
| G-F1 | 2026-08-06 | aprobado | Autorización Etapa 0 |
| G-E0 | 2026-08-06 | aprobado | Base UI: cinta, Modificar/Dibujar/Cadena, compositor L/R |
| G-E1 | 2026-08-06 | aprobado | Primer muro usable; autoriza MVP estricto |
