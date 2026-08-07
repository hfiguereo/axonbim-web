# Plan maestro — extracto operativo

El documento completo está en [plan-maestro-axonbim-web.pdf](plan-maestro-axonbim-web.pdf) (v1.0).

Este extracto solo indexa decisiones ya operativizadas en el repo para citas rápidas. Ante duda, prevalece el PDF + los docs de `docs/product` y `docs/architecture`.

## Decisiones ya aplicadas aquí

| Tema | Decisión | Doc en repo |
|------|----------|-------------|
| Naturaleza del proyecto | Reconstrucción, no port literal | vision, migration-rules |
| SoT | Documento paramétrico | ADR 0002, document-model |
| Stack | TS / React / Three / pnpm / Vite | overview, work-phases |
| JSON-RPC | No como arquitectura interna | overview, inventory |
| OpenCascade | No en MVP | ADR 0004 |
| IFC | Adaptador futuro | ADR 0003 |
| MVP | Muros + demo + `.axon` | mvp-scope |
| Agentes | Reglas cortas + docs amplios | AGENTS.md, .cursor/rules |
| Fases | Etapa 0 → muro → MVP → pausa | work-phases, gates |

## Secuencia oficial (maestro §56)

Auditoría → documento fundacional → decisiones → repo → AGENTS → rules → ADR → estructura mínima → Etapa 0 → primer muro → MVP → evaluación humana.

Este repositorio completa la fundación (F0+F1 docs). El código empieza solo tras autorización post-gate F1.
