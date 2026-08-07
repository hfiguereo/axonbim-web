# Matriz de aceptación — MVP estricto

Checklist humana. Una fila no está hecha si no se puede ejercer **desde la interfaz**.

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 1 | Abrir AxonBIM Web | parcial | Etapa 0 shell (`pnpm dev`) |
| 2 | Abrir proyecto vacío | parcial | Nuevo crea documento vacío |
| 3 | Abrir vivienda demo | parcial | Demo stub (sin muros aún) |
| 4 | Elegir familia de muro | pendiente | 100/150/200 mm |
| 5 | Dibujar varios muros encadenados | pendiente | |
| 6 | Cerrar un espacio | pendiente | |
| 7 | Seleccionar un muro | pendiente | |
| 8 | Cambiar altura | pendiente | comando + undo |
| 9 | Cambiar espesor | pendiente | |
| 10 | Cambiar familia | pendiente | |
| 11 | Eliminar muro | pendiente | |
| 12 | Undo | pendiente | |
| 13 | Redo | pendiente | |
| 14 | Cancelar preview con Escape | pendiente | sin historial |
| 15 | Snap ortogonal | pendiente | |
| 16 | Snap a extremos | pendiente | |
| 17 | Vista planta coherente | pendiente | misma geom |
| 18 | Vista perspectiva coherente | pendiente | |
| 19 | Ajustar modelo a vista | pendiente | |
| 20 | Exportar `.axon` | pendiente | v1 |
| 21 | Importar `.axon` | pendiente | v1 |
| 22 | Pruebas geométricas muro caja | pendiente | Vitest |
| 23 | Pruebas visuales mínimas | pendiente | Playwright u equiv. |

**Exclusiones:** ver [mvp-scope.md](../product/mvp-scope.md). Añadir filas de puertas/IFC/etc. está prohibido hasta aprobación post-MVP.
