# Changelog

## Unreleased

### F8 — Playwright oleada 1 (autorizado)

- Humo A: carga, demo, nuevo, export/abrir `.axon`, undo tras borrar muro
- Capturas B: layout con canvas enmascarado (`pnpm test:e2e`)
- Ver `docs/validation/playwright-f8.md`

### F5-S — estabilización (IDs, historial, `.axon`) — **aprobado 2026-08-07**

- `syncIdSequencesFromDocument` tras Nuevo / Demo / Abrir (evita colisión de IDs)
- `Command.execute` → `boolean`; historial solo registra mutaciones reales
- Parser `.axon` valida refs (storey/family/wall), geometría mínima e IDs duplicados
- Tests REG IDs, DeleteWall+puertas/ventanas undo/redo, no-op, round-trip
- Gate humano: pruebas manuales OK + logs limpios

### Post-MVP — puertas (ADR 0010)

- Entidad `Door`, familias 80/90/100; `door.create` / delete / familia / swing / hinge / hoja
- Hueco en muro (slabs); marco = forro interior (jambas + dintel, **sin umbral**)
- Hoja con paneles, bisagras, manilla horizontal; planta: arco + grips sentido/bisagra
- Familia editable en caliente; navegación: zoom, orbit 3D, pan planta

### Post-MVP — ventanas (ADR 0011)

- Entidad `Window`, familias 60×100 / 90×120 / 120×120; alféizar desde familia
- Comandos `window.create` / delete / familia / swing / hinge / hoja; solape con puertas y ventanas
- Cinta **Ventana**, colocación en muro, props + grips en planta; hoja por defecto cerrada

### Post-MVP — gizmo cámaras (ADR 0012)

- Clic en gizmo 3D aplica vistas reales: Z superior, Y frontal, X derecha, centro isométrica
- `setCameraPreset` en el viewer; orbit/zoom se conservan

## 2026-08-06 — MVP estricto (G-MVP)

- Snap muro + feedback; switch Snap en status; Cadena solo en opciones de muro (ADR 0009)
- Uniones L por **inglete** limpio (ADR 0008); zoom con rueda en planta/3D
- Demo vivienda 8×6 m; Fit; gizmo 3D animado (maqueta; texto al hover)
- Validación humana: dibujo usable — **G-MVP aprobado**

### Etapa 1 (G-E1)

- `wallBoxMesh`, comandos muro + historial, draw encadenado, props, undo/redo

### Etapa 0 (G-E0)

- Shell Revit LT, compositor, visor, `.axon` v1

### Licencia / fundación

- ADR 0007 propietaria; F0/F1 docs; ADR 0001–0006
