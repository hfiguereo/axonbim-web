<!--
  DOCUMENTO EXTERNO — copia literal recibida del dueño el 2026-08-08.
  No editar el cuerpo: es evidencia con fecha. Las respuestas del proyecto viven en
  ADR 0017 y docs/roadmap/domain-invariants-plan.md.
  Verificación independiente de sus hallazgos: ver "Contraste" al final del plan.
-->

# AxonBIM Web — Auditoría técnica rigurosa de código y documentación

**Fecha:** 2026-08-08  
**Repositorio auditado:** `axonbim-web-main(3).zip`  
**Ámbito:** código TypeScript/React/Three.js, modelo, Commands/History, geometría, persistencia `.axon`, sesión/UI, viewer, pruebas, CI, documentación Markdown y plan maestro PDF.  
**Método:** revisión estática del repositorio completo, trazado de dependencias, lectura de contratos/ADR/documentación, inspección dirigida de flujos de mutación y persistencia, ejecución de guardias autocontenidos, recuento independiente de pruebas y comprobación de enlaces relativos.  

---

## 1. Dictamen ejecutivo

La base arquitectónica de AxonBIM Web es **buena y merece conservarse**. El proyecto ya tiene una separación real entre `model`, `commands`, `geometry`, `persistence`, `viewer`, `tools` y la aplicación React; el grafo de dependencias observado es limpio y no presenta ciclos de dominio. La idea central —**AxonDocument como fuente de verdad, mutaciones confirmadas mediante Commands y Three.js como representación**— está implementada de forma reconocible y no es solamente retórica documental.

Sin embargo, el estado actual **no debe considerarse todavía un editor BIM robusto en integridad de datos**. Los problemas más importantes no están en la estructura de carpetas, sino en los límites entre dominio, comandos, persistencia y estado de sesión. Varias invariantes que la documentación declara como obligatorias sólo se verifican en la UI; los Commands pueden producir estados inválidos, la importación `.axon` valida parcialmente y hay dos fuentes de verdad para las cámaras (documento y `views`) que no participan juntas en Undo/Redo.

### Veredicto

- **Arquitectura base:** APROBADA, con correcciones localizadas.
- **Commands/History:** CONDICIONAL; buena mecánica de historial, pero contrato de validez incompleto.
- **Integridad del modelo:** NO APROBADA para ampliar features hasta cerrar los hallazgos críticos.
- **Persistencia `.axon`:** NO APROBADA como frontera robusta de datos externos.
- **Geometría de muros:** razonable para el alcance actual; huecos hospedados requieren endurecimiento.
- **Cámaras/vistas:** NO APROBADAS en consistencia de historial/carga.
- **Pruebas:** buenas como cinturón de regresión de helpers, insuficientes para los riesgos de producto más importantes.
- **Documentación:** conceptualmente fuerte, pero con deriva factual y contractual que debe corregirse.
- **CI/guardias:** buena base; no debe confundirse “CI verde” con “modelo BIM válido”.

### Recomendación de gate

**No abriría una nueva expansión funcional de Fase 4 antes de cerrar P0/P1 de esta auditoría.** No propongo un refactor masivo: los defectos pueden corregirse mediante una etapa de estabilización corta, centrada en validación de dominio, frontera `.axon`, huecos hospedados y reconciliación de cámaras/sesión.

---

## 2. Alcance realmente inspeccionado

### Inventario

- **95 archivos TS/TSX** contabilizados en código + tests/e2e.
- **18 archivos de unit tests**.
- **101 casos unitarios** detectados estáticamente.
- **3 specs E2E / 9 tests Playwright**.
- **48 documentos Markdown**.
- **1 PDF** (`plan-maestro-axonbim-web.pdf`), revisado también visualmente.
- Aproximadamente **12.8k líneas TS/TSX** en paquetes y aplicación, excluyendo documentación.

Distribución aproximada:

| Área | Líneas TS/TSX | Líneas en tests |
|---|---:|---:|
| `apps/web` | 6,332 | 391 |
| `packages/commands` | 1,177 | 178 |
| `packages/geometry` | 1,445 | 103 |
| `packages/viewer` | 2,484 | 255 |
| `packages/model` | 626 | 268 |
| `packages/persistence` | 315 | 75 |
| `packages/tools` | 261 | 84 |
| `packages/families` | 124 | 71 |
| `packages/shared` | 76 | 62 |

### Limitación de ejecución

El ZIP no incluía `node_modules` y el entorno de auditoría no pudo descargar dependencias desde el registro npm. Por tanto **no afirmo haber ejecutado con éxito** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` ni Playwright. La auditoría sí ejecutó los scripts autocontenidos que no requieren dependencias externas, tras inicializar metadatos Git temporales porque esos scripts usan `git ls-files`:

- `check-docs-indexed.mjs`: PASS.
- `check-layer-purity.mjs`: PASS.
- `check-no-test-shortcuts.mjs`: PASS.
- sintaxis Node de los scripts `.mjs`: PASS.

Esto es importante: el informe diferencia **“verificado en código”** de **“declarado por documentación/CI”** y no transforma una afirmación histórica de CI en evidencia nueva.

---

## 3. Lo que está bien y debe preservarse

### 3.1 Arquitectura real por capas

Grafo observado de imports internos:

```text
web         -> commands, families, geometry, model, persistence, shared, tools, viewer
model       -> families, shared
geometry    -> model, shared
commands    -> model
persistence -> model, shared
tools       -> shared
viewer      -> geometry, model
families    -> (ninguno)
shared      -> (ninguno)
```

No se detectaron ciclos entre paquetes ni importaciones del dominio hacia React/Three/UI. Esto respalda de forma real la arquitectura descrita en `docs/architecture/overview.md`.

### 3.2 La UI no muta directamente las colecciones del documento

La búsqueda de escrituras `document.walls =`, `.push`, etc. en producción no encontró mutaciones desde `apps/web`; las mutaciones observadas se concentran en Commands. Los únicos matches fuera de Commands eran tests. Esta es una señal positiva importante: el proyecto no ha recaído en un controlador UI que edita la geometría/documento directamente.

### 3.3 HistoryStack corrigió bien los no-op

La decisión de que `execute()` devuelva `boolean` permitió que `HistoryStack.push()` no apile comandos que no cambian nada y no borre indebidamente el redo. El hallazgo F5-S sobre no-op está correctamente orientado.

### 3.4 DeleteWall preserva hospedados en Undo

`packages/commands/src/walls.ts:38-78` guarda snapshots de puertas y ventanas hospedadas antes de borrar el muro y las restaura en Undo. Esto corrige un fallo serio previo y respeta la semántica BIM de relación host/hospedado mejor que una eliminación puramente gráfica.

### 3.5 Toolchain y CI bien planteados

- TypeScript `strict: true`.
- `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- lint separado de typecheck.
- unit tests y build separados en CI.
- E2E separado para distinguir fallos de navegador.
- lockfile y `--frozen-lockfile`.
- guardias propios para shortcuts, docs, capas e historial.

La dirección es correcta: controles pequeños y explícitos, no una capa de tooling opaca.

### 3.6 Plan maestro

El PDF maestro está visualmente limpio y legible. Sus principios siguen siendo sanos:

- evitar un port literal Godot/Python;
- no reinstalar JSON-RPC/SQLite como centro del producto;
- documento paramétrico como SoT;
- Commands/History;
- geometría analítica compartida por planta/3D;
- cortes verticales y gates;
- evitar un nuevo monolito equivalente a `main_scene.gd`.

No recomiendo reescribir el plan maestro. Recomiendo que los documentos operativos actuales indiquen claramente qué partes históricas han sido superadas.

---

# 4. Hallazgos críticos y altos

## AX-P0-01 — Los Commands no protegen las invariantes del dominio

**Severidad:** P0 — integridad de modelo  
**Estado:** abierto  
**Confianza:** alta, verificado directamente en código.

### Evidencia

La documentación es inequívoca:

- `docs/architecture/commands-and-history.md:14-16`: `execute` debe dejar el documento válido y un fallo de validación no debe entrar al historial; la UI debe recibir error explícito.
- `docs/architecture/coordinate-system.md:37-42`: `MIN_WALL_LENGTH`, `MIN_THICKNESS` y `MIN_HEIGHT` son mínimos, y valores inferiores deben causar rechazo explícito del Command.

Pero:

- `CreateWallCommand.execute` (`packages/commands/src/walls.ts:25-29`) sólo comprueba ID repetido del mismo tipo.
- `SetWallHeightCommand` (`:93-100`) acepta cualquier `number`, incluido `0.01`, negativo, `NaN` o `Infinity` si llega directamente.
- `SetWallThicknessCommand` (`:123-130`) tiene el mismo problema.
- `SetWallFamilyCommand` (`:155-164`) acepta un `familyId` inexistente y cualquier espesor.
- `CreateDoorCommand` (`packages/commands/src/doors.ts:22-27`) comprueba host wall, pero no familia, tamaño, límites del muro, solape, altura ni enums.
- Commands de cámaras permiten FOV/altura/target inválidos cuando se invocan directamente.

Además, la UI no cubre completamente los mínimos: `PropertiesPanel` declara `min={0.05}`, pero la lógica de cambio admite valores `> 0`, de forma que `0.01` puede propagarse al Command.

### Por qué es grave

Una aplicación BIM no puede depender de que **cada pantalla futura recuerde todas las invariantes**. Importación, agentes, nuevas herramientas, undo/redo, scripts internos o una futura API pueden invocar Commands sin pasar por ese formulario.

En la arquitectura declarada, el Command es la puerta de entrada de una mutación confirmada. Hoy esa puerta no garantiza el contrato que la propia documentación le asigna.

### Corrección exigida

Crear validadores de dominio compartidos, preferentemente bajo `@axonbim/model` o una capa de dominio deliberada:

- `validateWall(...)`
- `validateDoor(...)`
- `validateWindow(...)`
- `validateCamera(...)`
- `validateHostedOpening(...)`
- `validateDocument(...)`

Los Commands y `persistence` deben reutilizar la misma semántica, no mantener reglas duplicadas.

Recomiendo sustituir progresivamente el `boolean` de `execute()` por un resultado estructurado, por ejemplo conceptualmente:

```ts
type CommandResult =
  | { ok: true; changed: true }
  | { ok: true; changed: false; code: "noop" }
  | { ok: false; code: string; message: string };
```

No es necesario adoptar exactamente esta forma, pero sí separar **no-op** de **rechazo inválido**.

### Pruebas obligatorias

- altura `0.049`, `0`, negativa, `NaN`, `Infinity` → Command rechazado, historial intacto;
- espesor equivalente;
- muro con storey/family inexistente → rechazado;
- puerta/ventana con family/host inexistente → rechazado;
- apertura fuera del host o verticalmente imposible → rechazada;
- FOV y geometría de cámara inválidos → rechazados;
- validar que un Command fallido no limpia redo.

---

## AX-P0-02 — Catálogos de familias importados y UI usan fuentes de verdad incompatibles

**Severidad:** P0 — riesgo de producir `.axon` inválido desde un documento inicialmente válido  
**Confianza:** alta.

### Evidencia

`parseDocument()` acepta catálogos suministrados por el archivo:

- `packages/persistence/src/index.ts:170-177` usa `data.families`, `doorFamilies`, `windowFamilies` cuando existen.

Pero la sesión y la UI trabajan con los built-ins de `@axonbim/families`:

- `sketchToolSlice.ts:243` usa `doorFamilyById(activeDoorFamilyId)`.
- `:288` usa `windowFamilyById(...)`.
- `:391` usa `familyById(...)` para muros.
- `PropertiesPanel.tsx:213-217`, `295-299`, `373-377`, `438-470` renderiza exclusivamente `BUILTIN_*_FAMILIES`.

Los Commands, a su vez, no rechazan referencias a familias que no existan en `document.*Families`.

### Escenario de corrupción reproducible por inspección

1. Se abre un `.axon` válido que incluye únicamente una familia de muro personalizada en `families`.
2. La sesión mantiene o selecciona un ID built-in como `family.block-150`.
3. El usuario dibuja un muro.
4. `CreateWallCommand` acepta el ID aunque no exista en `document.families`.
5. El usuario exporta.
6. Al reabrir, `parseDocument` rechaza ese muro por `unknown familyId`.

El mismo contrato híbrido existe para puertas y ventanas.

### Decisión arquitectónica necesaria

Hay que escoger **una** de estas políticas y documentarla:

**A. Catálogos de documento reales** — recomendada para BIM:  
UI, herramientas y Commands consumen `document.families`, `document.doorFamilies` y `document.windowFamilies`; al cargar se reconcilian los IDs activos.

**B. Catálogo v1 fijo de built-ins** — más restrictiva:  
la persistencia no acepta catálogos arbitrarios todavía y el formato declara explícitamente esa limitación.

Lo peligroso es mantener el híbrido actual.

### Pruebas obligatorias

- abrir documento con catálogo custom → selector muestra ese catálogo;
- dibujar → entidad referencia una familia existente en el documento;
- exportar/reabrir → roundtrip válido;
- cargar documento sin el `activeFamilyId` previo → sesión selecciona una familia válida determinísticamente.

---

## AX-P1-03 — Validación de `.axon` incompleta y frontera JSON no segura estructuralmente

**Severidad:** P1  
**Confianza:** alta.

### Evidencia

`packages/persistence/src/index.ts:158-205` hace:

```ts
data = JSON.parse(text) as Partial<AxonFileV1>;
```

Ese cast sólo convence al compilador; no valida la forma en runtime.

Problemas concretos:

1. `storeys` y familias no validan cada objeto ni duplicados.
2. IDs repetidos se comprueban **por categoría**, no globalmente (`:213-216`), pese a que `document-model.md` describe ID único en el documento.
3. muro exige `height > 0` y `thickness > 0` (`:57-60`), no los mínimos documentados `0.05`.
4. puerta/ventana no comprueban que el hueco quepa en la longitud del muro.
5. no comprueban que altura+sill quepa en el muro.
6. no comprueban solape entre huecos.
7. no validan enums `hinge`, `swing`, `leafState` en runtime.
8. no validan de manera completa metadata/fechas/nombres/longitudes de strings.
9. formas maliciosas o simplemente incorrectas pueden provocar errores JS antes del `fail(...)`. Por ejemplo, un campo esperado como array pero recibido como objeto llega a `.map`.
10. las cámaras calculan `defaultCameraCrop(eye,target,fov)` antes de terminar de validar que `eye/target` tengan forma correcta.
11. un crop inválido aportado por el archivo es normalizado silenciosamente antes de validarse; esa política puede ser válida como migración, pero debe ser deliberada y documentada.

### Choque con auditoría previa

`docs/validation/technical-audit-2026-08.md:28` marca “A4 Validación `.axon` incompleta” como **cerrado** porque ya se verifican algunas referencias y longitudes. El cierre es demasiado amplio: el defecto original se redujo, pero la frontera continúa incompleta.

### Corrección

- parsear JSON a `unknown`;
- validar forma y tipos antes de castear;
- validar IDs globales o corregir formalmente el contrato si se quiere unicidad por tipo;
- usar los mismos validadores de dominio que Commands;
- errores siempre controlados `Invalid .axon file: ...`;
- decidir política de normalización/migración de campos legacy;
- añadir límites razonables de tamaño/cantidad de entidades al flujo de apertura.

No hace falta incorporar una librería de schema si no está autorizada: puede hacerse con validadores explícitos y pequeños.

---

## AX-P1-04 — Solape puerta↔ventana se valida de forma asimétrica

**Severidad:** P1  
**Confianza:** alta.

### Evidencia

Al colocar puerta:

- `sketchToolSlice.ts:253-256` sólo busca solape en `document.doors`.

Al colocar ventana:

- `:299-306` comprueba tanto puertas como ventanas.

Al cambiar familia de puerta:

- `selectionSlice.ts:275-278` vuelve a comprobar sólo puertas.

Al cambiar familia de ventana:

- `:368-375` comprueba puertas y ventanas.

Por tanto:

- **ventana → luego puerta** puede crear solape;
- una puerta existente puede crecer mediante cambio de familia e invadir una ventana.

### Impacto geométrico

`packages/geometry/src/openings.ts:100-121` procesa huecos secuencialmente con un `cursor`. El algoritmo no hace unión de intervalos ni define formalmente qué ocurre con huecos que se superponen. Con entradas solapadas puede generar losas duplicadas o una partición geométrica incoherente.

### Corrección

Una única función de dominio para validar intervalos hospedados, usada por:

- CreateDoor;
- CreateWindow;
- SetDoorFamily;
- SetWindowFamily;
- importación `.axon`;
- futuras operaciones de mover/redimensionar huecos.

La geometría debe declarar su precondición: **los huecos recibidos son válidos y no se solapan**, y puede añadir una aserción defensiva/test.

---

## AX-P1-05 — Cámaras tienen estado duplicado documento↔sesión y Undo/Redo no es transaccional

**Severidad:** P1  
**Confianza:** alta.

### Evidencia

La entidad cámara vive en `AxonDocument`, pero la pestaña/nombre visible de esa cámara vive además en `session.views`.

Creación:

- `sketchToolSlice.ts:473`: `CreateCameraCommand` modifica documento.
- `:475-494`: se crea separadamente un `ProjectView` y se modifica sesión.

Borrado:

- `selectionSlice.ts:154`: `DeleteCameraCommand`.
- `:155-160`: elimina la vista separadamente.

Renombrado:

- Command modifica `Camera.name`.
- sesión vuelve a modificar el `ProjectView.name` por otro camino.

Undo/Redo:

- `projectSlice.ts:95-116` sólo revierte `HistoryStack`/documento y limpia selección de muro/puerta/ventana.
- no restaura/reconcilia `views`.

### Estados inconsistentes posibles

- Undo de creación de cámara: `document.cameras` vuelve a 0, pero queda una vista `view.camera.*` apuntando a una cámara inexistente.
- Undo de borrado: cámara reaparece en documento, pero su vista eliminada no reaparece.
- Undo de rename: `Camera.name` vuelve al anterior, pero `ProjectView.name` puede quedar con el nuevo.

El E2E actual (`e2e/o2.spec.ts:44-67`) comprueba únicamente el contador `cameras:1 → cameras:0`, así que este defecto puede pasar verde.

### Corrección preferida

Evitar que la misma verdad semántica se almacene dos veces. Dos opciones:

1. **Derivar las entradas de cámara del documento** y crear/activar una vista de sesión de forma lazily/determinista.
2. Si `ProjectView` debe persistir como estado de sesión separado, crear una función única `reconcileViewsWithDocument(doc, views)` llamada después de create/delete/rename/undo/redo/import/new/demo.

La opción 1 reduce el número de invariantes cruzadas.

---

## AX-P1-06 — Abrir `.axon` no reconstruye ni limpia completamente el estado de sesión

**Severidad:** P1  
**Confianza:** alta.

### Evidencia

`projectSlice.openFromText` (`apps/web/src/session/projectSlice.ts:68-86`) sustituye documento e historial, pero **no**:

- restaura `views` a un conjunto válido para el documento cargado;
- define un `activeViewId` seguro;
- crea vistas para `document.cameras` importadas;
- limpia `selectedCameraId`;
- limpia selección de crop;
- limpia estado vivo de drag de crop/camera pose.

`newProject` y `openDemo` sí reemplazan `views`, pero tampoco limpian explícitamente toda la familia de estado cámara/crop.

`ProjectBrowser.tsx:15-17` muestra cámaras a partir de `views`, mientras también lee `document.cameras`. Si el documento importado tiene cámaras pero no existen `cameraViews`, el grupo puede quedar sin botones y tampoco mostrar “Sin cámaras” (`:67-83`).

### Consecuencia

Abrir un archivo nuevo después de haber trabajado con cámaras puede conservar vistas que apuntan al proyecto anterior, o importar cámaras que existen en el documento pero no son navegables desde la interfaz.

### Corrección

Centralizar la transición de proyecto:

```text
resetSessionForDocument(document)
  -> reconcile active family ids
  -> derive/rebuild views
  -> choose deterministic active view
  -> clear all selections
  -> clear live drag/preview/crop state
  -> sync ID sequences
  -> new HistoryStack
```

Y usarla en `newProject`, `openDemo` y `openFromText`.

---

# 5. Hallazgos medios

## AX-P2-07 — `touchDoc()` olvida `cameras`

**Evidencia:** `apps/web/src/session/touchDoc.ts:7-18` clona arrays de muros, puertas, ventanas, niveles y familias, pero no `cameras`.

Esto contradice la intención declarada de producir nuevas identidades de arrays para que Zustand/React detecte la mutación. Hoy algunas pantallas se refrescan por cambios incidentales de `views` o `documentRev`, pero el contrato es frágil.

**Corrección:** incluir `cameras: [...doc.cameras]` y añadir un test que compruebe todas las colecciones relevantes, no sólo `walls/meta`.

---

## AX-P2-08 — `boolean` en Commands mezcla no-op, error de validación y entidad inexistente

**Evidencia:** `documentMutation.ts:35-38` convierte cualquier `false` en el mismo texto: `Sin cambios (operación no aplicada)`.

Hoy `false` puede significar “mismo valor”, “ID duplicado”, “host no encontrado”, etc. En cuanto se introduzca validación seria, esta API impide cumplir `commands-and-history.md:16`, que exige error explícito a UI.

**Corrección:** resultado estructurado y códigos de error de dominio.

---

## AX-P2-09 — Contrato de IDs no coincide entre documentación e implementación

`document-model.md` describe IDs opacos, únicos en el documento y recomienda UUID v4; también habla de asignación en Command. El código actual:

- usa secuencias globales de módulo (`wall.1`, `door.1`, etc.);
- genera ID en la herramienta antes del Command;
- comprueba duplicidad sólo dentro del tipo;
- sincroniza secuencias después de carga con `syncIdSequencesFromDocument`.

La implementación actual puede ser perfectamente aceptable como etapa intermedia. El problema es el **contrato ambiguo**, no que aún no use UUID.

**Corrección:** decidir y documentar una de dos cosas:

- unicidad global + allocator/factory de dominio; o
- unicidad por tipo en v1 + IDs prefijados.

No recomiendo “migrar todo a UUID” sólo para cerrar este hallazgo.

---

## AX-P2-10 — Tolerancia geométrica de joins no coincide con la política documentada

`packages/geometry/src/wallBox.ts:37-39` agrupa endpoints mediante redondeo a milímetros:

```ts
Math.round(x * 1000)
```

Mientras `coordinate-system.md` define `EPS_LENGTH = 1e-6 m` para coincidencia de puntos. Además `miterCorners` usa literales `1e-8` y `1e-6` (`:69`, `:78`).

Eso significa que existe una segunda política de tolerancia oculta en geometría.

**Corrección:** declarar un `JOIN_TOLERANCE` deliberado o usar `EPS_LENGTH`; no confundir tolerancia topológica con `SNAP_TOLERANCE` de interacción. Añadir tests cerca de los límites.

---

## AX-P2-11 — Scene sync reconstruye toda la representación en cambios locales

`documentSceneSync.ts` limpia y vuelve a generar grupos dinámicos completos antes de reconstruir muros/huecos/cámaras. Además resuelve hosts mediante búsquedas lineales repetidas.

No lo considero un bug para el tamaño actual; es una **deuda de escalabilidad**. La arquitectura sigue correcta porque la representación es derivada. Pero antes de pretender miles de elementos debería medirse y evolucionar hacia actualización por elementos afectados / índices por ID.

**No recomiendo optimizarlo ahora antes de cerrar integridad.**

---

## AX-P2-12 — Cobertura de pruebas desalineada con los riesgos del producto

Hay 101 unit tests, pero la distribución importa más que el número.

### Huecos relevantes observados

No hay tests directos suficientes para:

- `doorGeometry.ts` (~426 líneas);
- `windowGeometry` y composición de múltiples huecos;
- `documentSceneSync.ts`;
- lifecycle de cámaras con `views` + Undo/Redo;
- `openFromText` con cámara/estado previo;
- Commands de validación de puertas/ventanas/muros;
- catálogo custom + roundtrip;
- solapes cross-type.

La propia documentación E2E reconoce el alcance:

- `docs/validation/playwright-f8.md:7`: no dibujo canvas/grips/gizmo.
- `:19-23`: puerta/ventana/cámara vía `__AXON_E2E__`, no gestos reales.
- `e2e/visual.spec.ts:8-20`: screenshots con canvas enmascarado.

Esto es válido como estrategia de estabilidad de tests, pero significa que la frase “Playwright aprobado” **no prueba** el camino geométrico/visual que más interesa a un modelador BIM.

### Prioridad de pruebas recomendada

1. invariantes de Commands;
2. import/export custom catalogs;
3. solapes puerta/ventana;
4. lifecycle cámara + undo/redo/import;
5. geometría de huecos;
6. un mínimo flujo real de canvas/picking cuando sea estable.

No recomiendo perseguir un porcentaje de coverage arbitrario.

---

# 6. Auditoría de documentación

## DOC-01 — `commands-and-history.md` documenta una API que ya no existe

El documento aún muestra:

```ts
execute(doc): void
push(cmd): void
```

pero el código usa `execute(doc): boolean` y `HistoryStack.push(cmd, doc): boolean`.

Esto es grave porque se trata del **contrato central de mutación**, no de un detalle cosmético.

**Acción:** actualizar el documento al código actual y, tras la corrección AX-P2-08, actualizarlo nuevamente al resultado estructurado definitivo.

---

## DOC-02 — `overview.md` asigna validación/serialización a `model`, pero la implementación las concentra en `persistence`

`docs/architecture/overview.md:15` dice que `model` posee “Entidades, IDs, validación, serialización”. `:20` dice que `persistence` no puede definir semántica de negocio aparte del modelo.

Hoy los validadores significativos viven en `packages/persistence`, mientras Commands no los comparten.

Esto no es sólo un documento desactualizado: identifica correctamente una responsabilidad que **todavía falta materializar**. AX-P0-01 y AX-P1-03 deberían cerrar también esta divergencia.

---

## DOC-03 — La auditoría técnica anterior sobredeclara A4 como cerrado

`docs/validation/technical-audit-2026-08.md:28` marca validación `.axon` como cerrada. La revisión actual demuestra que hay validaciones de referencias básicas, pero faltan estructura, límites, enums, fit de hospedados, solapes, unicidad global y errores controlados.

**Acción:** reabrir A4 o sustituirlo por los hallazgos de esta auditoría. Evitar “cerrado” cuando sólo se cubrió un subconjunto del contrato.

---

## DOC-04 — La misma auditoría contiene información operativa ya contradictoria

Ejemplos:

- línea 15 dice que protección remota A1 está pendiente;
- línea 65 dice que D5 está abierto por repo privado/plan gratuito;
- pero `docs/roadmap/github.md:12-18` afirma repo público y branch protection hechos;
- `docs/roadmap/pending-work.md:61` marca A1 cerrado.

`pending-work.md` se declara explícitamente fuente de verdad, por lo que el extracto de auditoría debe sincronizarse o marcar sus secciones históricas.

---

## DOC-05 — Recuento de tests desactualizado

`technical-audit-2026-08.md:42` dice “60 → 99 tests”. El recuento estático actual del repo es **101 unit tests**, más **9 E2E**.

Es un detalle menor por sí mismo, pero demuestra que los documentos de estado se están usando como log vivo y se vuelven obsoletos rápidamente.

---

## DOC-06 — Se afirma que no hay enlaces relativos rotos, pero existe uno

`technical-audit-2026-08.md:72-73` afirma “ningún enlace relativo roto”. Una comprobación independiente de **65 enlaces relativos** encontró **1 roto**:

- `CHANGELOG.md:55` enlaza `pending-work.md` desde raíz;
- el archivo real es `docs/roadmap/pending-work.md`.

El `check:docs` actual pasa porque comprueba alcanzabilidad/nombres desde `AGENTS.md`, no resolución de todos los links Markdown.

**Acción:** añadir `check:links` separado; no ampliar `check:docs` hasta volverlo difícil de entender.

---

## DOC-07 — README quedó atrás respecto al estado real

- `README.md:7` menciona ADR 0015 pero ya existe ADR 0016 aprobado.
- `:21-24` describe una etapa mucho más temprana.
- `:62` etiqueta Commands como “stub + stack”.
- `:63` etiqueta Geometry como “stub”.

Ambos paquetes tienen implementación sustancial. Para alguien nuevo, el README subestima el producto y confunde el punto de entrada.

---

## DOC-08 — `geometry-policy.md` necesita distinguir mejor MVP histórico vs extensiones post-MVP aprobadas

La política original deja puertas/ventanas/huecos como fuera del MVP, pero esos elementos ya fueron autorizados e implementados. No hace falta borrar el contexto histórico; sí añadir referencias explícitas a los ADR que los habilitaron y a sus nuevas invariantes.

---

## DOC-09 — Falta una matriz consolidada de aceptación post-MVP

La matriz del MVP prohíbe añadir filas sin autorización, lo cual era correcto. Puertas, ventanas, cámaras y crop ya pasaron por ADR/gates, pero sus criterios están dispersos entre ADR, changelog, Playwright y pending-work.

**Acción:** crear una matriz de aceptación post-MVP que liste por feature:

- contrato funcional;
- invariante de dominio;
- evidencia automatizada;
- validación visual/manual;
- comportamiento Undo/Redo;
- persistencia/roundtrip cuando aplique.

---

## DOC-10 — Los guardias son útiles, pero sus nombres pueden sugerir una cobertura mayor que la real

`check-layer-purity.mjs` impide React/Three/browser globals dentro de dominio y React/store dentro de viewer. Eso está bien, pero **no valida el DAG interno completo** entre paquetes; por ejemplo, una dependencia futura semánticamente incorrecta entre dos paquetes de dominio podría pasar si no toca esas prohibiciones. El grafo actual sí está limpio, pero el guardia no garantiza toda la dirección arquitectónica descrita.

`check-docs-indexed.mjs` verifica que un documento sea mencionado por path o basename y permite un salto desde un hub; no parsea realmente los enlaces ni valida que apunten a archivos existentes. El enlace roto de `CHANGELOG.md` demuestra esta diferencia.

**Acción:** mantener los guardias pequeños y honestos en su nombre/alcance; si se quiere proteger el DAG, añadir una allowlist explícita de dependencias por paquete en un guardia separado.

## TOOL-01 — Los guardias dependen de metadatos Git

Los tres scripts inspeccionados usan `git ls-files`. En el ZIP fuente recibido no venía `.git`, por lo que no podían ejecutarse hasta inicializar metadatos temporales. En CI esto no es problema porque existe checkout Git, pero sí reduce la portabilidad para auditorías sobre source archives.

**Acción P3:** documentar “requiere checkout Git” o añadir un fallback de filesystem que preserve exactamente las exclusiones esperadas.

---

# 7. Seguridad y robustez de entrada

## SEC-01 — Importación de archivo sin límites explícitos

El flujo abre un `File`, lo carga como texto y lo parsea en el hilo principal. No se observan límites de:

- tamaño de archivo;
- número de entidades;
- longitud de nombres/strings;
- complejidad de catálogos.

Para una aplicación local-first esto no equivale a una vulnerabilidad remota crítica, pero un `.axon` accidentalmente enorme o hostil puede bloquear la UI o consumir mucha memoria.

**Acción P3:** límite de tamaño antes de `text()`, caps razonables en parser y mensajes controlados.

## SEC-02 — Dependencias/CVE no pudieron auditarse dinámicamente

No se pudo ejecutar `pnpm audit` ni consultar el árbol instalado porque no había dependencias instaladas y el entorno no pudo acceder al registry. Por rigor, este informe **no declara** que las dependencias estén libres de vulnerabilidades.

## SEC-03 — No se encontraron patrones obvios de inyección peligrosa en el código inspeccionado

La búsqueda no encontró uso de `eval`, `dangerouslySetInnerHTML` o equivalentes como patrón de UI. Tampoco se encontraron secretos `.env` versionados en el árbol recibido.

## SEC-04 — Google Fonts y `host: true`

- `index.html` depende de Google Fonts, reduciendo pureza offline/local-first y exponiendo metadata de red aunque no datos del proyecto.
- `vite.config.ts` usa `server.host: true`, adecuado si se prueba desde LAN, pero innecesariamente expone el dev server si no se necesita.

Son hardening P3, no bloqueantes de arquitectura.

---

# 8. Rendimiento y escalabilidad

### Estado actual

No hay señales de una arquitectura inherentemente incapaz de escalar, pero el viewer aún usa reconstrucción global y búsquedas lineales. Para el tamaño del demo/MVP es razonable priorizar claridad.

### Riesgos a vigilar

- reconstrucción completa de representación en cambios pequeños;
- creación/disposal frecuente de geometrías;
- búsquedas `find` por host para cada hueco;
- sincronizaciones impulsadas por selección además de mutación documental;
- eventual coste de JSON completo para proyectos grandes.

### Orden correcto

1. integridad del dominio;
2. medición con proyectos sintéticos crecientes;
3. sólo después, índices `Map`, dirty sets y sync incremental.

No recomiendo introducir OCCT, workers, IndexedDB u otra infraestructura para “arreglar rendimiento” sin una medición que demuestre el cuello real.

---

# 9. Coherencia con los principios arquitectónicos de AxonBIM

## Elementos BIM paramétricos vs edición directa

El código actual de muros/puertas/ventanas sigue un enfoque paramétrico: dimensiones y familias son propiedades del modelo y la geometría se regenera. **Eso es coherente** con mantener Push & Pull/Edit Mode como línea separada.

No encontré en este código una mutación de malla Three.js convertida en fuente de verdad ni un Push & Pull infiltrándose en las entidades BIM. Esto debe preservarse.

## Workplanes / referencias espaciales

> **Nota 2026-08-09:** WP-v1 + SK-v1 cerrados (Workplane + Sketch rectángulo → muros).
> Edit Mode / Push&Pull siguen parked. Ver workplanes-roadmap + editing-paradigms.
> El texto siguiente es el diagnóstico original de la auditoría (2026-08-08).

La hoja de ruta mantiene workplanes como trabajo futuro. La arquitectura actual todavía no introduce una abstracción común de referencia espacial, lo cual es aceptable si no se implementan todavía los distintos modos de edición. Cuando se abra esa fase, debe hacerse como abstracción compartida de referencia, **no fusionando las reglas de Parametric Edit, Sketch Mode y Edit Mode**.

## Commands como frontera

La estructura existe, pero AX-P0-01 demuestra que la frontera es todavía mecánica, no semántica. Antes de agregar edición más potente, Commands deben convertirse en garantes reales de invariantes.

---

# 10. Matriz resumida de riesgo

| ID | Hallazgo | Sev. | Bloquea expansión |
|---|---|---|---|
| AX-P0-01 | Commands no garantizan invariantes | **P0** | **Sí** |
| AX-P0-02 | Catálogos custom vs built-ins pueden corromper roundtrip | **P0** | **Sí** |
| AX-P1-03 | Parser `.axon` incompleto/unsafe shape | **P1** | **Sí** |
| AX-P1-04 | Solape puerta↔ventana asimétrico | **P1** | **Sí** |
| AX-P1-05 | Cámara + views fuera de la misma transacción/history | **P1** | **Sí** |
| AX-P1-06 | `openFromText` no reconcilia sesión/cámaras | **P1** | **Sí** |
| AX-P2-07 | `touchDoc` no clona cameras | P2 | No, junto a P1 cámaras |
| AX-P2-08 | Resultado booleano de Command insuficiente | P2/P1 habilitador | Sí, para AX-P0-01 |
| AX-P2-09 | Contrato de IDs divergente | P2 | No |
| AX-P2-10 | Tolerancias geométricas dobles | P2 | No |
| AX-P2-11 | Scene sync global | P2 | No |
| AX-P2-12 | Tests no cubren riesgos principales | P2 | Sí, como gate de los P0/P1 |
| DOC-01..09 | Deriva documental | P2 | No, pero corregir con los fixes |
| SEC-01..04 | Hardening | P3 | No |

---

# 11. Plan de estabilización recomendado

El orden es importante para evitar arreglar síntomas en la UI mientras el dominio sigue permisivo.

## Bloque S1 — Contrato de validez único

1. Definir validadores de dominio reutilizables.
2. Definir resultado estructurado de Command.
3. Adaptar `HistoryStack` para apilar sólo `changed:true`.
4. UI muestra motivo real del rechazo.
5. Tests negativos de mínimos, refs, finitos y no-op.

**Gate:** ningún Command público puede dejar `AxonDocument` inválido según el contrato documentado.

## Bloque S2 — Huecos hospedados

1. Función única para validar `centerOffset`, width, sill/height y solapes.
2. Usarla en puertas y ventanas, create y family change.
3. Usarla en parser.
4. Tests cross-type.
5. Test de `wallMeshWithOpenings` con varios huecos válidos y rechazo previo de solapados.

**Gate:** el orden puerta→ventana y ventana→puerta produce el mismo resultado de validación.

## Bloque S3 — Catálogos de familias

1. Elegir contrato A (catálogo de documento) o B (built-ins fijos v1).
2. Eliminar mezcla de ambos.
3. Reconciliar active family IDs al cargar.
4. Selectores desde la fuente elegida.
5. Roundtrip custom catalog.

**Gate:** cualquier documento que abre correctamente puede ser editado y exportado sin introducir referencias de familia inválidas por los flujos normales.

## Bloque S4 — Cámaras/sesión

1. Eliminar o reconciliar duplicación `Camera.name` / `ProjectView.name`.
2. Una función de reset/reconcile para new/demo/open.
3. Aplicarla también después de undo/redo si las views siguen separadas.
4. `touchDoc` incluye cámaras.
5. Tests camera create/delete/rename → undo/redo.
6. E2E comprueba navegador/pestaña, no sólo contador.

**Gate:** `document.cameras` y `session.views(kind=camera)` nunca pueden contradecirse después de una acción pública.

## Bloque S5 — Parser `.axon`

1. JSON→`unknown`.
2. Shape validation completa.
3. Validación semántica compartida.
4. IDs y enums.
5. errores controlados.
6. caps de importación razonables.
7. pruebas de archivos malformados y roundtrip.

**Gate:** cualquier entrada inválida se rechaza de forma controlada y ninguna entrada aceptada viola los invariantes del modelo.

## Bloque S6 — Documentación y guards

1. actualizar `commands-and-history.md`;
2. actualizar responsabilidades `overview.md`;
3. corregir README;
4. corregir link de CHANGELOG;
5. añadir `check:links`;
6. reabrir/corregir A4 en auditoría previa;
7. sincronizar estado branch protection;
8. crear matriz de aceptación post-MVP.

**Gate:** documentación operativa y código describen el mismo contrato en la fecha de cierre.

---

# 12. Pruebas de regresión mínimas que exigiría a Cursor

No aceptar “compila” como evidencia. Para cada cambio exigir problema, datos, invariantes, componentes y pruebas.

### Commands/model

- CreateWall válido/inválido.
- SetWallHeight y SetWallThickness en límites y valores no finitos.
- family/storey inexistentes.
- no-op conserva redo.

### Hosted openings

- puerta contra puerta;
- puerta contra ventana en ambos órdenes;
- ventana contra ventana;
- family change que introduce solape;
- extremos de muro;
- height/sill incompatibles.

### Persistence

- arrays con forma incorrecta;
- IDs repetidos;
- refs inexistentes;
- enums inválidos;
- números no finitos;
- custom catalogs;
- cámara sin eye/target;
- roundtrip aceptado→aceptado.

### Cameras/session

- crear → undo → no camera view huérfana;
- redo → camera view recuperada;
- borrar → undo → vista recuperada;
- renombrar → undo → nombre consistente;
- abrir archivo A después de archivo B con cámaras → no quedan refs de B;
- importar cámara → aparece navegable.

### Geometry

- múltiples huecos no solapados;
- joins en tolerancia;
- endpoints cercanos pero no coincidentes no se unen accidentalmente.

---

# 13. Qué NO recomiendo hacer como reacción a esta auditoría

- no refactorizar todo el store;
- no migrar a UUID sólo por limpieza estética;
- no introducir OCCT;
- no introducir IndexedDB/OPFS para resolver estos defectos;
- no convertir Three.js en modelo;
- no mover validación de vuelta a la UI;
- no añadir “más tests” indiscriminadamente: añadir los tests que rompen los invariantes encontrados;
- no mezclar esta estabilización con Push & Pull/Edit Mode/workplanes.

---

# 14. Conclusión final

AxonBIM Web no está ante un problema de “reescribir arquitectura”. La arquitectura principal es una de las partes más sólidas del repositorio. El riesgo está en que el sistema **declara un dominio más estricto de lo que realmente hace cumplir**.

El mayor salto de calidad ahora no vendría de una nueva feature ni de un refactor grande. Vendría de convertir las reglas ya escritas en **invariantes ejecutables**:

```text
entrada/UI/agente
      ↓
Command
      ↓
VALIDACIÓN DE DOMINIO ÚNICA
      ↓
AxonDocument válido
      ↓
History / Persistence / Geometry
      ↓
representación derivada
```

Cuando esa frontera esté cerrada, el proyecto quedará mucho mejor preparado para trabajo futuro de workplanes, modos de edición, IFC u OCCT sin reproducir el problema clásico de un modelador donde cada herramienta inventa sus propias reglas.

**Resultado de auditoría:** base arquitectónica conservable; estabilización P0/P1 obligatoria antes de ampliar el alcance.
