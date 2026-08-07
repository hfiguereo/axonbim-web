# Changelog

## Unreleased

### MVP estricto (en curso — autorizado tras G-E1)

- Snap muro (`@axonbim/tools`): extremos, ortogonal (ángulo/eje + Shift), cierre de cadena; feedback visual en visor
- Switches **Snap** en barra de estado (Cadena solo en opciones de muro — sin redundancia); ADR 0009
- Uniones L: extensión de malla `thickness/2` en extremos compartidos (ADR 0008)
- Demo vivienda 8×6 m + tabique; Fit en icon bar y cinta Vista → Ajustar
- Maqueta gizmo orientación 3D (tipo Blender) en perspectiva — stub
- Checklist: `docs/validation/acceptance-matrix.md` (Pendiente: Playwright)

### Etapa 1 (hecho — G-E1, `bc0ef5b`)

- `wallBoxMesh` + métricas/tests en `@axonbim/geometry`
- Comandos `wall.create` / delete / set height|thickness|family + `HistoryStack`
- Dibujo encadenado en planta (P1→P2, preview), sync meshes, pick/selección
- Propiedades editables del muro seleccionado; QAT undo/redo (Ctrl+Z/Y)

### Etapa 0 (hecho — G-E0, `b226f5c`)

- Monorepo pnpm: `apps/web` + packages de dominio
- Base de interfaz futura aprobada (`docs/ui/interface-base.md`)
- Shell Revit LT: menú Archivo en logo, cinta de iconos, opciones de herramienta, Modificar/Dibujar/Cadena
- Compositor de paneles izq./der./flotante (resize ancho/alto)
- Visor Three: planta ortogonal / perspectiva; demo `.axon`
- Persistencia `.axon` v1 (parse/serialize)

### Licencia

- Sustitución de GPL-3 por licencia propietaria (All Rights Reserved); ADR 0007

### Fundación (F0 + contratos F1 documentales)

- Repositorio independiente `axonbim-web`
- Documentación de producto, arquitectura, migración, ADR 0001–0006, validación y roadmap
- Reglas Cursor unificadas; plan maestro PDF en `docs/migration/`
- Gates G-F0 y G-F1 aprobados (2026-08-06)
