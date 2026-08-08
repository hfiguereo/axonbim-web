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

> **Estado 2026-08-08.** Ese último párrafo describe el arranque, no el presente: F1, Etapa 0,
> Etapa 1, MVP, F5-S y F8 (Playwright o1 + CI + o2) están cerrados. Ver
> [`gates.md`](../roadmap/gates.md) para el estado vigente. La secuencia de arriba se
> conserva como registro de la decisión original.
>
> Este documento y el PDF estuvieron **fuera del índice de `AGENTS.md`** hasta 2026-08-08:
> existían pero ningún agente los leía. Hallazgo D1 en
> [`technical-audit-2026-08.md`](../validation/technical-audit-2026-08.md).
