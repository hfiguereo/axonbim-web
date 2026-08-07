# Changelog

## Unreleased

### Etapa 1 (siguiente)

- Corte vertical: dibujar muro encadenado → documento → geometría → planta/3D → selección → undo

### Etapa 0 (hecho)

- Monorepo pnpm: `apps/web` + packages de dominio
- Base de interfaz futura aprobada (`docs/ui/interface-base.md`) — G-E0
- Shell Revit LT: menú Archivo en logo, cinta de iconos, opciones de herramienta, Modificar/Dibujar/Cadena
- Compositor de paneles izq./der./flotante (resize ancho/alto)
- Visor Three: planta ortogonal / perspectiva; demo `.axon`
- Persistencia `.axon` v1 (parse/serialize); muro aún stub de UI

### Licencia

- Sustitución de GPL-3 por licencia propietaria (All Rights Reserved); ADR 0007

### Fundación (F0 + contratos F1 documentales)

- Repositorio independiente `axonbim-web` (sin código de aplicación)
- Documentación de producto, arquitectura, migración, ADR 0001–0006, validación y roadmap
- Reglas Cursor unificadas (8 mandatos)
- Plan maestro PDF en `docs/migration/`
- Gates G-F0 y G-F1 listos para aprobación humana; Etapa 0 bloqueada hasta autorización
