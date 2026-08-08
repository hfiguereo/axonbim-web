# Changelog

## Unreleased

### Gobernanza — merge a `main` y primacía del producto (2026-08-08)

- Rama `cursor/windows-and-gizmo-cameras` fusionada en `main`; política **solo `main`** en adelante
- ADR 0006 / gates / no negociable 21: validación estricta de factores críticos aunque el dueño apresure (sin reglas nuevas)

### Región de recorte de vista (ADR 0016) — **aprobado 2026-08-08**

- Tipo `ViewCrop` (AABB); `Camera.crop` en `.axon`; crop de sesión independiente en planta/perspectiva
- Planta: crop de sesión con **máscara + clip**; cámaras: cono + marco solo si la cámara está seleccionada
- Seleccionar el **marco** de cámara → grips y arrastre (mueve cámara+crop juntos)
- Vista cámara: clip + marco en pantalla; el crop de cámara no clipea la planta
- Props **Viewport** (sin selección / con cámara); convención «producto(s) de referencia»; baseline → `reference-shell-baseline.md`

### Cámaras geométricas (ADR 0015) — **aprobado 2026-08-08**

- Herramienta **Vista → Cámara**: colocar en planta (ojo → mira)
- Entidad `Camera` (eye, target, FOV, crop); vista 3D ligada e independiente de Perspectiva 3D
- Navegador: grupo **Cámaras**; props: nombre, altura ojo, FOV, recorte
- Persistencia en `.axon` (`cameras[]`)

### Navegación 3D — gizmo tríada, ortho y pivot (ADR 0014) — **aprobado 2026-08-08**

- Gizmo: ejes ±X/±Y/±Z (vistas orto) + hub isométrica; **hold/arrastre** = órbita del modelo
- Órbita también con clic medio/derecho; pivot **Modelo | Selección** en la barra de iconos
- Picking con tolerancia al zoom (líneas/grips + proximidad en pantalla)

### F8 — Playwright oleada 1 — **aprobado 2026-08-08**

- Humo A: carga, demo, nuevo, export/abrir `.axon`, undo tras borrar muro
- Capturas B: layout con canvas enmascarado (`pnpm test:e2e`)
- Config: no reutilizar Vite ajeno en 5173 (evita timeouts del menú Archivo)
- Ver `docs/validation/playwright-f8.md`

### Refactor controlado session/viewer — cortes 1–7c (2026-08-08)

- Plan: `docs/roadmap/refactor-session-viewer.md`
- Corte 1: `viewCropResolve.ts` — active/clipping crop + tests
- Corte 2: `viewCropDrag.ts` — begin/update/commit drag + tests
- Corte 3: `sessionTypes.ts` — tipos de vista/docks/cinta
- Corte 4: `viewCropClip.ts` — clip GPU + máscara planta fuera de `createViewport` + tests
- Corte 5: `cameraPresetPose.ts` — pose pura de presets gizmo (ADR 0014) + tests
- Corte 6: `fitWallsFraming.ts` — AABB + framing planta/3D de `fitWalls` + tests
- Corte 7a: lote trivial — `defaultViews` + `displayCycles` + `touchDoc` + tests
- Corte 7b: `pickTolerance.ts` — umbral de raycaster + radios de grip en píxeles (contrato de selección) + tests
- Corte 7c: `documentMutation.ts` — aplicar comando / undo / redo con tests del invariante F5-S en sesión
- Política: 1 peel crítico / hasta 3 triviales; agente clasifica; Opus en críticos
- ADR 0016: nota de producto — marcos de recorte cliqueables/editables (requisito, no extra)

### CI: typecheck + tests unitarios verificados en Actions (2026-08-08)

- Nuevo `.github/workflows/ci.yml`; antes el único workflow era Playwright, así que
  «typecheck y tests verdes» nunca se verificaba de forma independiente
- Límites anotados en `docs/roadmap/github.md`: `lint` no ejecuta nada; `model`/`families`/`shared` sin tests

### Marco de recorte más fácil de agarrar (2026-08-08)

- Tolerancia de clic del **marco de crop**: 12 px → **16 px** (era la más estrecha de la app, sobre línea fina)
- Invariante con prueba: el marco no puede ser más estrecho que la selección de entidades
- Auditoría técnica **reverificada** contra el código: hallazgos A1–A4 cerrados; B1–B5 y C1 registrados


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

- Shell (inspirado en productos de referencia), compositor, visor, `.axon` v1

### Licencia / fundación

- ADR 0007 propietaria; F0/F1 docs; ADR 0001–0006
