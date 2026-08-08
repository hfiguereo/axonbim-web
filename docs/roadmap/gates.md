# Gates — paradas de evaluación

El agente y el desarrollo humano **se detienen** en cada gate. “Continúa con el proyecto” no autoriza saltarse un gate ni refactorizaciones de riesgo.

| Gate | Tras | Pregunta de salida | Siguiente solo si |
|------|------|--------------------|-------------------|
| **G-F0** | Fundación docs + rules | ¿Alcance MVP y rules sin inflación? | Autorias F1 cerrado o Etapa 0 |
| **G-F1** | Contratos de dominio | ¿Coords, documento, comandos, `.axon`, inventario OK? | Autorizas **Etapa 0 (código)** |
| **G-E0** | App abrible | ¿Layout/navegación útiles? | Autorizas Etapa 1 |
| **G-E1** | Primer muro | ¿Corte vertical usable? | Autorizas MVP estricto |
| **G-MVP** | MVP estricto | ¿Sensación de dibujo, claridad, utilidad? | Autorizas post-MVP (puertas/etc.) |
| **F5-S** | Estabilización IDs/historial/`.axon` | ¿Regresiones cerradas y uso manual OK? | Autorizas Playwright u otra cola |

## Estado actual

- **G-MVP:** aprobado (2026-08-06)
- **Post-MVP código:** puertas (0010), ventanas (0011), gizmo→cámaras (0012)
- **F5-S:** **aprobado** (2026-08-07) — validación técnica + humana; ver `f5-stabilization.md`
- **F8 Playwright oleada 1:** **autorizado** (2026-08-07) — alcance estrecho, tipos A+B, solo local. Ver `docs/validation/playwright-f8.md`
- **Navegación 3D (ADR 0014):** **aprobado** 2026-08-08 — gizmo tríada ±ejes + ortho + pivot / hold-orbit
- **Cámaras (ADR 0015):** **aprobado** 2026-08-08 — Vista → Cámara + vista 3D ligada
- **Crop Region (ADR 0016):** **aprobado** 2026-08-08 — clip por vista; planta vs cámara independientes
- **Parked:** paradigmas/workplanes, OCCT (ADR 0013)
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
| F5-S (inicio) | 2026-08-07 | autorizado | Congelar features; estabilizar (A1+C ventanas) |
| **F5-S (cierre)** | **2026-08-07** | **aprobado** | Tests verdes + pruebas humanas; logs limpios |
| **F8 Playwright o1** | **2026-08-07** | **autorizado** | Estrecho + A/B; local; sin CI |
| **ADR 0014 gizmo** | **2026-08-08** | **aprobado** | Tríada ±ejes + hold-orbit |
| **ADR 0015 cámaras** | **2026-08-08** | **aprobado** | Cámara geométrica + vista ligada |
| **ADR 0016 crop** | **2026-08-08** | **aprobado** | Clip por vista; marco seleccionable en planta |
