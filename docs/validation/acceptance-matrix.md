# Matriz de aceptación — MVP estricto

Checklist humana. Una fila no está hecha si no se puede ejercer **desde la interfaz**.

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 1 | Abrir AxonBIM Web | hecho | `pnpm dev` |
| 2 | Abrir proyecto vacío | hecho | Archivo → Nuevo |
| 3 | Abrir vivienda demo | hecho | Archivo → Abrir demo (8×6 + tabique) |
| 4 | Elegir familia de muro | hecho | Props / Type Selector (100/150/200) |
| 5 | Dibujar varios muros encadenados | hecho | Cadena on; esquinas rellenas (ADR 0008) |
| 6 | Cerrar un espacio | hecho | Snap close al origen de cadena |
| 7 | Seleccionar un muro | hecho | Clic en mesh |
| 8 | Cambiar altura | hecho | Props + comando + undo |
| 9 | Cambiar espesor | hecho | Props |
| 10 | Cambiar familia | hecho | Props |
| 11 | Eliminar muro | hecho | Delete / Backspace |
| 12 | Undo | hecho | QAT / Ctrl+Z |
| 13 | Redo | hecho | QAT / Ctrl+Y |
| 14 | Cancelar preview con Escape | hecho | sin historial |
| 15 | Snap ortogonal | hecho | enter ~12° / hold ~22° (LR1); Shift; switch status |
| 16 | Snap a extremos | hecho | hit ~0.2 m en planta; feedback visual |
| 17 | Vista planta coherente | hecho | misma `wallBoxMesh` + joins |
| 18 | Vista perspectiva coherente | hecho | misma geom |
| 19 | Ajustar modelo a vista | hecho | icon bar Fit + Vista → Ajustar |
| 19b | Zoom rueda | hecho | planta (ortho) + 3D (dolly) |
| 20 | Exportar `.axon` | hecho | Archivo → Exportar |
| 21 | Importar `.axon` | hecho | Archivo → Abrir |
| 22 | Pruebas geométricas muro caja | hecho | Vitest + inglete |
| 23 | Pruebas visuales mínimas | hecho | Playwright F8 o1 **aprobado** + o2/CI **autorizados** 2026-08-08 — ver `playwright-f8.md` |
| 24 | Toggle Snap en UI | hecho | barra de estado (Cadena solo en opciones de muro) |
| 25 | Gizmo orientación 3D | maqueta | 3D animado; texto al hover; cámara real = post-MVP |

**Gate G-MVP:** aprobado 2026-08-06 (validación humana).

**Exclusiones:** ver [mvp-scope.md](../product/mvp-scope.md). Añadir filas de puertas/IFC/etc. está prohibido hasta aprobación post-MVP.
