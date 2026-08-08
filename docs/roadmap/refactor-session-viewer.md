# Refactor controlado — sessionStore / viewer

## Autorización

**2026-08-08** — dueño: refactor controlado · cortes 1–7c.  
Pruebas manuales adicionales del dueño (tras corte 4): sin problemas reportados.

## Principio

Microcortes con comportamiento idéntico. Tras cada autorización: `pnpm test` + `pnpm test:e2e` **una vez** al cerrar el corte.  
No reescribir `sessionStore` ni `createViewport` de un golpe. No IFC/OCCT/workplanes.

### Ritmo de peels (2026-08-08, dueño)

| Tipo | Regla |
|------|--------|
| **Crítico** | **1 peel** por autorización. Toca SoT/historial, crop ADR 0016, picking/selección, navegación/cámara con contrato de producto, o riesgo alto de regresión visual. |
| **Trivial** | Hasta **3 peels** agrupados en la misma autorización. Helpers puros ya acotados, tipos/reexports, constantes UI (`defaultViews`, ciclos escala/estilo), clones superficiales sin semántica nueva. |

Si hay duda → tratar como **crítico** (1 peel). No mezclar un crítico con triviales en el mismo corte.

### Quién clasifica (dueño no tiene que adivinar)

**El agente clasifica** cada peel propuesto. El dueño solo confirma el OK.  
En cada propuesta de corte, el agente entrega una ficha:

```
Peel: <nombre>
Clase: crítico | trivial
Por qué: <1–2 líneas>
Factores tocados: <lista o “ninguno de la tabla”>
Ritmo: 1 peel | lote trivial N/3
Modelo: Opus | Composer
```

#### Tabla de decisión (sí → **crítico**)

| ¿La función / peel toca…? | Ejemplo en este repo |
|---------------------------|----------------------|
| **Documento / SoT** (walls, doors, cameras, `.axon`) | parse, serialize, IDs |
| **Comandos / historial** (undo, `execute`, `applyCommand`) | `HistoryStack`, mutaciones |
| **Selección o picking** (qué ID recibe el clic) | `pickWallId`, `worldPerPixel`, grips |
| **Crop / clip** (ADR 0016) | resolve/drag crop, clipping planes |
| **Navegación 3D con contrato** (ADR 0014/0015) | órbita, presets gizmo, cámara geométrica |
| **Coordenadas / tolerancias** | snap, planos, fit que cambie pivote “de verdad” del modelo |
| **Regresión visual fácil** si el número falla | umbrales de pick, máscaras de planta |

#### Suele ser **trivial** (lote ≤3) si es solo…

| Caso | Ejemplo |
|------|---------|
| Mover **tipos** / constantes / reexports | `sessionTypes`, `CameraPreset` type |
| Helper **puro** con tests, sin I/O ni picking | AABB fit, ecuaciones de plano ya extraídas |
| UI de **shell** sin mutar documento | docks, ciclos escala/estilo, `defaultViews` |
| Clone superficial para re-render | `touchDoc` (arrays shallow) |
| Docs / CHANGELOG / gates del propio corte | — |

**Regla práctica:** si un fallo del peel puede **borrar undo**, **seleccionar mal**, **clipar mal** o **romper SoT** → crítico. Si solo mueve código y un test unitario basta → trivial.

#### Cortes hechos (re-clasificados)

| Corte | Clase | Motivo |
|-------|-------|--------|
| 1 resolve crop | **crítico** | ADR 0016 — qué crop clipea |
| 2 drag crop | **crítico** | mutación live + commit crop |
| 3 sessionTypes | **trivial** | solo tipos |
| 4 viewCropClip | **crítico** | clip GPU / máscara planta |
| 5 cameraPresetPose | **crítico** | ADR 0014 poses gizmo |
| 6 fitWallsFraming | **trivial\*** | framing de vista; no muta modelo (*borderline; tratado como peel único por seguridad*) |
| 7a shell session | **trivial×3** | `defaultViews` + ciclos UI + `touchDoc` |
| 7b pickTolerance | **crítico** | define qué entidad recibe el clic |
| 7c documentMutation | **crítico** | SoT + undo/redo |

\*A partir de ahora, peels como el 6 pueden ir en **lote trivial** si son helpers puros de framing/UI.

### Modelos (2026-08-08, dueño)

Autorizado **Opus** (`claude-opus-5-thinking-high` en subagentes) para **equilibrar** gasto:

| Trabajo | Modelo preferido |
|---------|------------------|
| Corte **crítico**, diseño de peel, ambigüedad / riesgo de regresión | **Opus** (subagente o chat en Opus) |
| Lote **trivial** (hasta 3), verify mecánico, docs de cierre | Modelo del chat / Composer (más barato) |

El agente padre no puede cambiar solo el modelo del chat: el dueño lo elige en el selector de Cursor. En subagentes, Opus solo si el dueño lo autorizó (esta sección).

## Corte 1 (**hecho**) — resolución de crop

- `viewCropResolve.ts` + 6 tests

## Corte 2 (**hecho**) — drag de crop

- `viewCropDrag.ts` + 6 tests

## Corte 3 (**hecho** 2026-08-08) — tipos de sesión

- `session/sessionTypes.ts`: `ProjectView`, docks, ribbon, estilos, orbit, constantes de cámara
- `sessionStore` reexporta por compatibilidad; UI importa tipos desde `sessionTypes`

## Corte 4 (**hecho** 2026-08-08) — clip/máscara del viewer

- `packages/viewer/src/viewCropClip.ts`: planos GPU, máscara de planta, `applyViewCropClipping`
- `viewCropClip.test.ts` (2) — ecuaciones AABB → planos
- `createViewport` delega clip/máscara; vitest en `@axonbim/viewer`

## Corte 5 (**hecho** 2026-08-08) — pose de presets de cámara

- `packages/viewer/src/cameraPresetPose.ts`: `resolveCameraPresetPose` + tipo `CameraPreset`
- `cameraPresetPose.test.ts` (3) — top / iso / clamp distancia
- `createViewport.setCameraPreset` solo aplica la pose al runtime Three.js

## Corte 6 (**hecho** 2026-08-08) — framing fit-to-walls

- `packages/viewer/src/fitWallsFraming.ts`: AABB + poses planta/perspectiva
- `fitWallsFraming.test.ts` (4)
- `createViewport.fitWalls` solo aplica el framing al runtime

## Corte 7a (**hecho** 2026-08-08) — shell session (lote trivial×3)

- `session/defaultViews.ts`
- `session/displayCycles.ts` — escala / estilo / detalle
- `session/touchDoc.ts` — clone superficial post-comando
- `sessionShell.test.ts` (3)

## Corte 7b (**hecho** 2026-08-08) — tolerancia de picking (crítico×1)

- `packages/viewer/src/pickTolerance.ts`: `orthoWorldPerPixel`, `perspectiveWorldPerPixel`,
  `pickLineThreshold`, `screenScaledRadius` + constantes en píxeles del contrato de selección
- `pickTolerance.test.ts` (6) — escalado por zoom, suelos, clamp de distancia de pivote
- `createViewport` deja de repetir `(orthoHalfH * 2) / max(height, 1)` (estaban **6** copias)

**Equivalencia verificada** fórmula por fórmula antes de cerrar (ortho, perspectiva,
umbral de raycaster, 3 radios de grip, escala de paneo): sin cambio numérico.

Hallazgos anotados (no cambiados — cambiarlos altera comportamiento):

- Los umbrales de proximidad **no son uniformes**: entidad 14 px, grip crop 14, marco crop 12,
  flip control 16. Ahora están nombrados en un solo archivo; unificarlos sería decisión de producto.
- Se eliminó código muerto en `pickCropGrip` (`const wpp = …; void wpp;`), sin efecto en runtime.

## Corte 7c (**hecho** 2026-08-08) — mutación de documento / historial (crítico×1)

- `apps/web/src/session/documentMutation.ts`: `applyCommandToSession`, `undoInSession`,
  `redoInSession` + `NO_MUTATION_STATUS`
- `documentMutation.test.ts` (6) — incluye el invariante F5-S: un comando que **no** muta
  no se registra, no incrementa `documentRev` y **no borra la pila de rehacer**
- `sessionStore` solo aplica el patch devuelto; `runUndo`/`runRedo` añaden el reset de selección

Antes no había ninguna prueba del contrato de historial a nivel de sesión: el invariante
F5-S solo estaba cubierto en `@axonbim/commands`, no en el camino que usa la UI.

## Estado: ACTIVO — desacople real (2026-08-08)

**R1 resuelto:** abandonar microcortes como vía principal; adoptar **slices Zustand** (session)
y **módulos compositor** (viewer). Plan: [`pending-work.md`](pending-work.md).

### Estrategia slices / módulos

| Área | Compositor | Módulos |
|------|------------|---------|
| Session | `session/createSessionStore.ts` (~20 líneas) | `projectSlice`, `shellSlice`, `viewportBridgeSlice`, `selectionSlice`, `viewCropSlice`, `sketchToolSlice` |
| Viewer | `createViewport.ts` (~223 líneas) | `viewportContext`, `viewportSceneGraph`, `viewportCameraController`, `documentSceneSync`, `cropOverlayLayer`, `viewportPicking`, `viewportUserData` |

Contratos cross-slice: `session/sliceContracts.ts`.

### Medición tras desacople (Fases 1–2)

| Métrica | Antes (pausa microcortes) | Tras desacople | Δ |
|---------|---------------------------|----------------|----|
| `sessionStore.ts` | 1541 líneas | **~13** (re-export) | compositor |
| `createViewport.ts` | 1316 líneas | **~223** | **−83 %** |
| Módulos session (prod.) | parcial | **~2500** en slices | estado + handlers fuera del monolito |
| Módulos viewer (prod.) | parcial | **~1500** en 7 módulos | sync/camera/pick separados |

**B5 cerrado** en auditoría (session + viewer).

Cortes 1–7c permanecen como **histórico** (testabilidad ganada; −7 % monolito).

## Parada anterior (microcortes)

Cortes 1–7c cerrados. Microcortes **pausados** el 2026-08-08 tras medición −7 %.

## Siguiente (Fase 4 — requiere OK)

Cola en [`pending-work.md`](pending-work.md) § Fase 4. No mezclar con desacople.

Resueltos desde la última edición de esta sección:

- Tolerancia del marco de crop: **subida a 16 px** (2026-08-08), ADR 0016 y
  `packages/viewer/src/pickTolerance.ts`.
- Auditoría completa: **hecha** (2026-08-08), serie D + guardias P1–P5.
- Desacople real Fases 1–2: **hecho** (2026-08-08).
