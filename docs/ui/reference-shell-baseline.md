# Base de interfaz — panorama de producto de referencia

**Estado:** aprobado como base de producto (2026-08-06).  
Los elementos se moverán o simplificarán según avance el desarrollo. No implica paridad de features con ningún producto comercial de terceros.

## Regiones de la ventana

1. **File / menú archivo** — New, Open, Save, Export, Options…
2. **Quick Access Toolbar (QAT)** — Save, Undo, Redo (+ atajos)
3. **Ribbon (cinta)** — pestañas por tarea + pestaña contextual al herramienta/selección
4. **Options / contextual de colocación** — parámetros del modo activo (renglón bajo la cinta)
4b. **Gestionar → Interfaz** — mostrar/ocultar paneles y barras (no renglón permanente bajo la cinta)
5. **Properties** — acoplable izq./der./flotante; Type Selector + instancia/tipo
6. **Project Browser** — acoplable; Views, Schedules, Sheets, Families…
7. **Drawing area** — vistas abiertas en pestañas; lienzo de la vista activa
8. **View Control Bar** — por vista: escala gráfica, estilo visual, detalle, recorte…
9. **Status Bar** — tips, elemento bajo cursor, filtros

Ver detalle aprobado: [interface-base.md](interface-base.md).

## Project Browser (estructura objetivo)

- Views → Floor Plans, Ceiling Plans, 3D, Elevations, Sections, Drafting, Legends, Schedules  
- Sheets · Families · Groups · Links  
- Crear vistas desde cinta **View**; la vista **aparece en el navegador**

## Ribbon (pestañas objetivo a largo plazo)

Architecture · Insert · Annotate · View · Manage · Modify (con Dibujar/Cadena al trazar)  
Structure / Analyze / Collaborate: fuera del núcleo web inicial (como en un LT reducido).

## View Control Bar (inferior de vista / fijo de app en v0)

Escala gráfica · Nivel de detalle · Estilo visual · (más adelante: recorte, hide/isolate)

## Principio de evolución

Partimos de este mapa. Cada etapa **activa** un subconjunto; la maqueta stub no es backlog obligatorio.
