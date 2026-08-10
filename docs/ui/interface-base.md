# Base de interfaz AxonBIM Web — aprobada

**Estado:** aprobada como base de la interfaz futura (2026-08-06).  
**Alcance de producto:** la maqueta valida UX; no implica implementar todas las herramientas stub en Etapa 0–1.

Fuente viva del shell: `apps/web`. Referencia conceptual: [reference-shell-baseline.md](reference-shell-baseline.md). Detalle operativo v0: [axonbim-shell-v0.md](axonbim-shell-v0.md).

## Principios

1. Inspiración en **productos de referencia** BIM (distribución y hábitos), no paridad de features con terceros.
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
| Lienzo | Vistas en pestañas; planta = ortogonal (**zoom** rueda, **pan** clic medio); 3D = perspectiva (**orbit** clic medio/derecho); puerta/ventana en planta = arco + grips sentido/bisagra |
| Barra de vista | **Fit**, escala, estilo, detalle, render (stub) — bajo el lienzo |
| Estado | Mensaje + switch **Snap** + meta (`tool` / `walls` / `snap:`) — Cadena solo en opciones de herramienta (sin redundancia) |
| Gizmo 3D | Widget Three.js animado (esquina sup. der. en perspectiva); texto solo al resaltar un extremo; orientación real = etapa futura |

## Snap y cadena (MVP)

- **Cadena:** solo en Modificar / barra de opciones de muro (default on). No duplicar en status bar.
- **Snap:** switch en barra de estado + feedback visual. Detalle: [ADR 0009](../decisions/0009-wall-snap-and-statusbar-toggles.md).
- Esquinas de malla rellenas por extensión de eje: [ADR 0008](../decisions/0008-wall-corner-join-extension.md).

## Anti-redundancia UI

No duplicar el mismo control en cinta/opciones y barra de estado (u otras zonas) salvo petición explícita.
## Compositor de paneles

- Botones en título: **◧** izquierda · **▢** flotar · **◨** derecha.
- Arrastre del título; preview en ambos bordes; **Ctrl** evita acople.
- Columna: asa vertical = **ancho**; separador entre paneles = **alto**.
- Flotantes viven en capa a nivel workspace (coords alineadas con bordes).

## Cinta y Modificar (trazado)

Al activar **Muro** (y futuros sketch tools):

1. Pestaña → **Modificar \| Colocar muro**
2. Grupos **Modo** (Terminar / Cancelar) + **Dibujar** (línea, rectángulo, arcos, pick) — **SK-draw** implementado
3. Grupo **Cadena**: Encadenar (default) · Soltar · Dividir (solo modo línea)
4. Barra de opciones: altura, espesor, checkbox Cadena, modo de dibujo

**Plano de trabajo (WP-v2):**
- **Arquitectura → Plano de trabajo**: **Seleccionar**, **Dibujar** (línea →
  plano vertical XYZ), **Nivel** — disponibles de forma general (base para
  futuro model-in-place).
- **Modificar → Plano de trabajo**: **Seleccionar** + **Nivel** solo cuando hay
  geometría o trazo activo (no duplicar «Dibujar» aquí).
- Overlay del parche activo; status bar muestra el Workplane.

**Sketch sobre elemento activo (SK-sel + SK-profile):** doble clic en muro o
**Modificar → Editar perfil**. En el Workplane activo oculta el sólido y muestra
el **contorno resultante** (huella/cara/silueta, no el eje) en líneas + vértices.
Rectángulo/arco redibujan; **Terminar** aplica; **Cancelar** descarta. Contrato:
[`sketch-result-outline.md`](../architecture/sketch-result-outline.md).

**Reutilización de dibujo:** losas / terreno / barridos / sketch de perfil usan
las **mismas** herramientas del grupo Dibujar (+ Terminar/Cancelar) que se abren
con Muro — no una segunda cinta de dibujo. Detalle:
[`editing-paradigms.md`](../architecture/editing-paradigms.md).

Mostrar/ocultar UI: **Gestionar → Interfaz**.

## Arquitectura — herramientas activas

En **Arquitectura → Construir**: **Muro**, **Puerta**, **Ventana** (colocación en muro; familia en Propiedades).
En **Arquitectura → Plano de trabajo**: **Seleccionar**, **Dibujar**, **Nivel**.
Resto de iconos = stubs de maqueta.

## Propiedades numéricas (panel)

Campos vía `PropsNumberInput` en **Propiedades** (altura / espesor muro; altura nueva;
viewport crop; cámara ojo / FOV).

| Control | Comportamiento |
|---------|----------------|
| Spinners ▲▼ | Commit inmediato del valor completo |
| Teclado | Draft local: se puede borrar y escribir (p. ej. `0.20`); commit en **blur** / **Enter** (o al completar un número válido); **Esc** descarta el draft |

**BUG-UI-NUM** — **corregido** 2026-08-10 (`PropsNumberInput` + `propsNumberCommit`).

## Qué queda fuera de Etapa 0–1 (aunque esté en la maqueta)

Cotas, sheets, IFC, render real, sync, la mayoría de Modify geométrico — se activan por etapa cuando el gate lo autorice. Puertas/ventanas: post-MVP (ADR 0010 / 0011).

## Cómo correr

```bash
pnpm install
pnpm dev   # http://127.0.0.1:5173/
```
