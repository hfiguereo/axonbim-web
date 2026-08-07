# Base de interfaz AxonBIM Web — aprobada

**Estado:** aprobada como base de la interfaz futura (2026-08-06).  
**Alcance de producto:** la maqueta valida UX; no implica implementar todas las herramientas stub en Etapa 0–1.

Fuente viva del shell: `apps/web`. Referencia conceptual: [revit-lt-baseline.md](revit-lt-baseline.md). Detalle operativo v0: [axonbim-shell-v0.md](axonbim-shell-v0.md).

## Principios

1. Inspiración **Revit LT** (distribución y hábitos), no paridad de features Autodesk.
2. Cinta **compacta** (altura fija, iconos + tip corto al hover).
3. Paneles **acoplables** izq./der./flotante con compositor usable.
4. Herramientas de **trazado** abren **Modificar + Dibujar**; inserción puntual no.
5. **Cadena de muro activa por defecto**; Soltar / Dividir en Modificar → Cadena.
6. Stub ≠ deuda: botones grises son mapa UX, no backlog obligatorio de la etapa.

## Mapa de la ventana

| Zona | Contenido |
|------|-----------|
| Chrome | Logo **AxonBIM** = menú Archivo (Nuevo, Abrir, Guardar, Exportar, Opciones…) + QAT |
| Cinta | Pestañas por tarea; herramientas = iconos; tip flotante corto |
| Opciones | Renglón bajo la cinta = parámetros de la herramienta activa |
| Dock izq./der. | Propiedades + Navegador (stack vertical, ancho y alto redimensionables) |
| Lienzo | Vistas en pestañas; planta = cámara ortogonal |
| Barra de vista | Escala, estilo, detalle, render (stub) |
| Estado | Mensajes de modo / herramienta |

## Compositor de paneles

- Botones en título: **◧** izquierda · **▢** flotar · **◨** derecha.
- Arrastre del título; preview en ambos bordes; **Ctrl** evita acople.
- Columna: asa vertical = **ancho**; separador entre paneles = **alto**.
- Flotantes viven en capa a nivel workspace (coords alineadas con bordes).

## Cinta y Modificar (trazado)

Al activar **Muro** (y futuros sketch tools):

1. Pestaña → **Modificar \| Colocar muro**
2. Grupos **Modo** (Terminar / Cancelar) + **Dibujar** (línea, rectángulo, arcos, pick…)
3. Grupo **Cadena**: Encadenar (default) · Soltar · Dividir
4. Barra de opciones: altura, espesor, checkbox Cadena, modo de dibujo

Mostrar/ocultar UI: **Gestionar → Interfaz**.

## Qué queda fuera de Etapa 0–1 (aunque esté en la maqueta)

Puertas, ventanas, cotas, sheets, IFC, render real, sync, la mayoría de Modify geométrico — se activan por etapa cuando el gate lo autorice.

## Cómo correr

```bash
pnpm install
pnpm dev   # http://127.0.0.1:5173/
```
