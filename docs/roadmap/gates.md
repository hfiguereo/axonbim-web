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

- **G-F0:** entregado — revisión humana pendiente (docs + 8 rules + commit local)
- **G-F1:** entregado — revisión humana pendiente (contratos + inventario)
- **Código (E0+):** bloqueado hasta autorización explícita post G-F1
- **GitHub `origin`:** pendiente de `gh auth login` + `gh repo create` (ver github.md)

## Registro de aprobación

| Gate | Fecha | Decisión | Notas |
|------|-------|----------|-------|
| G-F0 | _pendiente firma humana_ | | Fundación material lista en repo |
| G-F1 | _pendiente firma humana_ | | Contratos en `docs/architecture/` + inventory |
