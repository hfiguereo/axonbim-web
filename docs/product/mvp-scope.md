# Alcance del MVP estricto

Fuente: Plan Maestro §24–26. Esta es la definición oficial del primer producto usable.

## Incluido

### Proyecto

- Nuevo proyecto
- Proyecto de demostración (vivienda de muros)
- Formato propio versionado (`.axon` / JSON v1)

### Muros

- Crear muro (P1 → P2)
- Muros encadenados
- Snapping ortogonal
- Snapping a extremos
- Cierre básico
- Previsualización (no entra al historial)
- Cancelación con Escape

### Familias (tres configuraciones)

| Familia | Espesor |
|---------|---------|
| Muro ligero | 100 mm |
| Bloque | 150 mm |
| Bloque | 200 mm |

Espesor personalizado desde propiedades. Sin editor general de familias.

### Edición

- Seleccionar, resaltar
- Modificar altura y espesor
- Cambiar familia
- Eliminar
- Undo / redo

### Vistas

- Planta
- Perspectiva
- Ajustar modelo a vista

### Persistencia

- Exportar / importar JSON `.axon`
- Recuperación temporal limitada
- Formato versionado

## Excluido (obligatorio)

Puertas · ventanas · losas · múltiples niveles editables · medición · PWA · OPFS · IndexedDB como almacenamiento principal · IFC · DXF · cotas · documentación técnica · secciones · elevaciones documentales · OpenCascade · colaboración · multiusuario · render fotorrealista · Push/Pull · normativa MIVED operativa

## Criterio de éxito

El MVP termina cuando un usuario puede, desde la UI:

1. Abrir AxonBIM Web  
2. Abrir proyecto vacío  
3. Abrir vivienda demo  
4. Elegir familia de muro  
5. Dibujar varios muros encadenados  
6. Cerrar un espacio  
7. Seleccionar un muro  
8. Cambiar altura  
9. Cambiar espesor  
10. Cambiar familia  
11. Deshacer / rehacer  
12. Exportar e importar `.axon`  
13. Ver planta y perspectiva coherentes  

Checklist operativa: [acceptance-matrix.md](../validation/acceptance-matrix.md).

## Tras el MVP

Pausa obligatoria de validación de producto. Puertas/ventanas y el resto solo con aprobación explícita.
