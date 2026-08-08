# Gates — paradas de evaluación

El agente y el desarrollo humano **se detienen** en cada gate. “Continúa con el proyecto” no autoriza saltarse un gate ni refactorizaciones de riesgo.

**Validación estricta de lo crítico:** cuando un tramo acumula muchas decisiones (producto, arquitectura, git, alcance), los factores críticos de ADR 0006 / no negociables **se validan uno a uno** antes de cerrar. Una frase de aprobación global («apruebo todo») o un clic de UI **no** sustituye esa lista. El producto prevalece sobre el impulso del momento.

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
- **F8 Playwright oleada 1:** **aprobado** (2026-08-08) — humo A+B local; checklist humana OK. Ver `docs/validation/playwright-f8.md`
- **F8-CI + oleada 2:** **aprobado** (2026-08-08) — Actions verde sin avisos Node 20; o2 puerta/ventana/cámara
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
| **F8 Playwright o1 (cierre)** | **2026-08-08** | **aprobado** | `pnpm test:e2e` verde + checklist humana 1–5 OK |
| **F8-CI + oleada 2** | **2026-08-08** | **autorizado** | CI en main; o2 puerta/ventana/cámara (hooks) |
| **F8-CI + oleada 2 (cierre)** | **2026-08-08** | **aprobado** | Actions verde; actions Node 24 (sin aviso @v4) |
| **ADR 0014 gizmo** | **2026-08-08** | **aprobado** | Tríada ±ejes + hold-orbit |
| **ADR 0015 cámaras** | **2026-08-08** | **aprobado** | Cámara geométrica + vista ligada |
| **ADR 0016 crop** | **2026-08-08** | **aprobado** | Clip por vista; marco seleccionable en planta |
| **Merge → main** | **2026-08-08** | **hecho** | `cursor/windows-and-gizmo-cameras` → `main`; política solo-main + primacía producto (ADR 0006 reforzado) |
