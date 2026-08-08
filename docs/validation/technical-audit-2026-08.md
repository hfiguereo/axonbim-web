# Auditoría técnica (extracto operativo)

Documento de trabajo consolidado 2026-08-07. Versión adaptada al repo: los hallazgos siguen vigentes salvo donde el código ya los corrigió.

## Conclusión

Arquitectura alineada (documento SoT, comandos, geometría, React, Three). **F5-S aprobado** (2026-08-07). Siguiente cola: Playwright (con autorización).

## Hallazgos

| ID | Tema | Severidad | Nota repo |
|----|------|-----------|-----------|
| A1 | Colisión de IDs tras importar | P0 | Secuencias `wall.N` / `door.N` / `window.N` no se sincronizan al cargar |
| A2 | Undo de muro sin hospedados | P0 | **Corregido** en rama (doors + windows) |
| A3 | No-ops en historial | P1 | `HistoryStack.push` apila siempre |
| A4 | Validación `.axon` incompleta | P1 | Solo format/meta básicos |

## No introducir en esta fase

OCCT · IFC operativo · IndexedDB/OPFS/PWA · colaboración · migrar todo a UUID.

Plan de corrección: [`f5-stabilization.md`](../roadmap/f5-stabilization.md).
