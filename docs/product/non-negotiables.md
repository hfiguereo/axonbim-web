# Principios no negociables

Fuente: Plan Maestro §58. Aplican a producto y a agentes.

1. El documento paramétrico es la fuente de verdad.
2. Three.js no es fuente de verdad del modelo.
3. React no modifica directamente el documento.
4. Toda mutación confirmada pasa por comandos.
5. Las previsualizaciones no entran al historial.
6. El trazado trabaja sobre un plano matemático (Workplane derivado del storey activo; no SoT en `.axon`).
7. Cambiar de vista no modifica el modelo ni el Workplane.
8. IFC es un adaptador (futuro), no el runtime del gesto.
9. OpenCascade no entra en el MVP.
10. Cada fase produce una mejora visible.
11. El usuario no necesita leer código para validar una entrega.
12. No existen refactorizaciones masivas automáticas.
13. La arquitectura no cambia sin autorización.
14. Las tareas tienen alcance explícito.
15. No se añaden funciones hipotéticas.
16. No se modifican archivos no relacionados.
17. Las pruebas no se eliminan para ocultar fallos.
18. Una función de usuario no está terminada si no puede usarse desde la interfaz.
19. El proyecto demo se mantiene actualizado.
20. El agente se detiene al cumplir el objetivo.
21. La aprobación apresurada (propia o de UI) no sustituye la validación estricta de gates, SoT, ADRs y evidencia; el producto prevalece sobre el impulso del momento (ADR 0006).
