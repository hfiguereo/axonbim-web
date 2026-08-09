# ADR 0017 — Invariantes del documento en dominio, no en la UI

## Estado

**Propuesto** (2026-08-08). Auditoría interna + [auditoría externa](../validation/external-audit-2026-08-08.md)
coincidentes. Implementación **no autorizada**; plan por fases en
`docs/roadmap/domain-invariants-plan.md`.

Revisión 2 (2026-08-08): incorpora la auditoría externa y **corrige** la decisión sobre el
resultado de `Command` (ver «Corrección de la revisión 1»).

## Contexto

ADR 0002 declara que `AxonDocument` es la fuente de verdad y que los comandos son la única
vía de mutación. Ese contrato **se cumple** en lo mecánico: no existe mutación de `walls`,
`doors`, `windows` ni `cameras` fuera de `HistoryStack`, y la auditoría externa lo confirma
de forma independiente (§3.2).

Lo que falla es distinto: **los comandos no defienden las reglas que la propia
documentación les asigna**. `docs/architecture/commands-and-history.md:14-16` dice que
`execute` deja el documento válido, que un fallo de validación no entra al historial y que
la UI recibe **error explícito**. Hoy `CreateDoorCommand.execute`
(`packages/commands/src/doors.ts:22`) comprueba dos cosas: ID no duplicado y `wallId`
existente. Las reglas geométricas viven en `apps/web/src/session/sketchToolSlice.ts` y
`selectionSlice.ts`.

La frontera existe, pero es mecánica, no semántica.

### Mapa de invariantes (verificado en código)

| Invariante | `commands`/`model` | UI | `persistence` (import) |
|---|---|---|---|
| Hueco dentro del muro (`centerOffset ± width/2`) | no | `sketchToolSlice.ts:249` | **no** |
| Huecos sin solape en el mismo muro | no | **asimétrico**, ver abajo | **no** |
| `sill + height ≤ wall.height` | no | `sketchToolSlice.ts:261`, `:311` | **no** |
| Cabida tras cambiar de familia | no | `selectionSlice.ts:264`, `:271`, `:356` | **no** |
| `familyId` existe en el catálogo del documento | no | usa built-ins, no el documento | `index.ts:70`, `:86` |
| Mínimos `MIN_WALL_LENGTH` / espesor / altura | no | `sketchToolSlice.ts:386` | parcial (`> 0`, no `0.05`) |
| FOV 10–120° | no | clamp `selectionSlice.ts:178` | `index.ts:124` |
| eye ≠ target | no | `sketchToolSlice.ts:456` | `index.ts:127` |
| ID único en el documento | por colección | genera ID antes del comando | por colección (`index.ts:213`) |
| Borrado de muro restaura hospedados | **sí** (`walls.ts:49`) | — | — |
| ViewCrop normalizado (cámara) | **sí** (`cameras.ts:25`) | — | `index.ts:198` |
| No-op no ensucia el historial | **sí** (`history.ts:17`) | — | — |

### Los cinco agujeros con consecuencia real

1. **Solape puerta↔ventana asimétrico, alcanzable hoy desde la interfaz.** Colocar una
   puerta solo busca solape contra `document.doors` (`sketchToolSlice.ts:253`); colocar
   ventana comprueba ambos (`:299-306`). Igual al cambiar de familia
   (`selectionSlice.ts:275` vs `:368`). Por tanto **ventana y luego puerta sí solapa**, y
   una puerta puede crecer por cambio de familia e invadir una ventana. No es un riesgo
   hipotético de «otro flujo futuro»: es un bug de producto presente. Agravante:
   `packages/geometry/src/openings.ts:100-121` procesa huecos con un cursor secuencial sin
   unión de intervalos, así que con entradas solapadas la partición geométrica es
   indefinida.
2. **Importar `.axon` no valida geometría.** `validateDoor` / `validateWindow`
   (`packages/persistence/src/index.ts:63-93`) revisan referencias y signos, no cabida, no
   solape, no `sill + height`. Además `JSON.parse(text) as Partial<AxonFileV1>`
   (`:161`) es un cast, no una validación de forma: un campo que debía ser array y llega
   como objeto revienta en `.map` antes de cualquier `fail(...)` controlado.
3. **Catálogos de familias híbridos.** `parseDocument` acepta `data.families` del archivo
   (`:171-177`), pero la sesión y el panel trabajan con los built-ins de
   `@axonbim/families` (`PropertiesPanel.tsx:213,295,373`; `sketchToolSlice.ts:243,288,391`)
   y ningún comando comprueba el catálogo del documento. Secuencia de corrupción: abro un
   `.axon` válido con catálogo propio → dibujo un muro con un ID built-in → exporto →
   **al reabrir mi propio archivo, `parseDocument` lo rechaza**.
4. **La sesión permite estados que el disco rechaza.** El clamp de FOV está en
   `selectionSlice.ts:178`, no en `SetCameraFovCommand`, y `parseDocument` exige 10–120°.
   Mismo patrón para mínimos de muro. El daño aparece al reabrir, que es lo peor.
5. **Cámaras con dos fuentes de verdad.** La entidad vive en el documento; la pestaña y su
   nombre viven además en `session.views`. Crear, borrar y renombrar tocan las dos por
   caminos separados (`sketchToolSlice.ts:473-494`, `selectionSlice.ts:151-173`), y
   undo/redo solo revierte el documento (`projectSlice.ts:95-116`). Undo de «crear cámara»
   deja una vista huérfana; undo de «borrar» no devuelve la vista; undo de rename deja los
   dos nombres discrepando. El E2E actual solo cuenta cámaras, así que pasa en verde.

### Corrección de la revisión 1

La revisión 1 de este ADR decidió mantener `execute: boolean` «porque encaja con la
detección de no-op». Eso era insuficiente y la auditoría externa lo señala bien (AX-P2-08).
El motivo decisivo no es de estilo: `documentMutation.ts:35-38` convierte **todo** `false`
en el mismo texto, «Sin cambios (operación no aplicada)». Con `boolean` es imposible
distinguir «mismo valor» de «rechazado por inválido», y por tanto imposible cumplir
`commands-and-history.md:16`, que exige error explícito a la UI. El contrato documentado ya
pedía lo que `boolean` no puede expresar.

## Decisión

1. **Una sola fuente por regla.** Cada invariante se expresa como **predicado puro** en
   `packages/model` (sin Three, sin React, sin DOM: regla `00-architecture` §5):
   `validateWall`, `validateDoor`, `validateWindow`, `validateCamera`,
   `validateHostedOpening`. `packages/persistence` deja de tener semántica propia y pasa a
   consumir los mismos predicados (cierra también la divergencia DOC-02 de la auditoría:
   `overview.md:15` ya asigna la validación a `model`).
2. **Tres consumidores del mismo predicado:** comandos para garantizar, persistencia para
   validar la entrada externa, UI para explicar. La UI conserva sus mensajes actuales; deja
   de ser la única que conoce la regla.
3. **Resultado estructurado de `Command`**, separando no-op de rechazo:

   ```ts
   type CommandResult =
     | { ok: true; changed: true }
     | { ok: true; changed: false; code: "noop" }
     | { ok: false; code: string; message: string };
   ```

   `HistoryStack` apila solo `changed: true`; un comando rechazado **no limpia el redo**.
   La forma exacta se fija al implementar; lo que decide este ADR es que hay que
   distinguir los tres casos.
4. **Rechazar, no corregir.** Un comando que viola un invariante es un rechazo, no un
   comando que ajusta valores por su cuenta. Los clamps de conveniencia (recortar la altura
   de una puerta al cambiar de familia) son decisión de la **herramienta**, no del comando.
5. **Simetría sesión ↔ disco como invariante con prueba.** Todo estado alcanzable con
   comandos debe pasar `parseDocument`. Prueba: aplicar comandos → serializar → reabrir.
6. **La geometría declara precondición, no la suple.** `packages/geometry` asume huecos
   válidos y sin solape, y lo dice explícitamente. Sus clamps defensivos actuales
   (`openings.ts:87-94`) dejan de ser la última línea de defensa.

### Decisiones que este ADR no puede tomar solo

Dos bifurcaciones son de producto y necesitan decisión del dueño **antes** de implementar
las fases correspondientes. Se documentan aquí para que no se decidan por omisión:

- **Catálogo de familias:** (A) catálogos del documento son reales y la UI los consume, o
  (B) v1 declara un catálogo fijo de built-ins y la persistencia deja de aceptar catálogos
  arbitrarios. El híbrido actual es lo único inaceptable.
- **Cámaras y vistas:** (A) derivar las entradas de cámara del documento, o (B) mantener
  `ProjectView` como estado de sesión con una función única de reconciliación llamada tras
  create/delete/rename/undo/redo/import. (A) reduce invariantes cruzadas.

### Contrato de IDs

`document-model.md` describe IDs opacos y únicos en el documento; el código usa secuencias
de módulo por tipo, genera el ID en la herramienta y comprueba duplicados por colección.
La implementación actual es aceptable como etapa intermedia; **el contrato ambiguo no lo
es**. Hay que elegir: unicidad global con allocator de dominio, o unicidad por tipo
declarada formalmente en v1. Migrar a UUID solo por estética no es el objetivo.

## Consecuencias

- Aparecen rechazos que antes no existían: un `.axon` inválido que hoy abre, mañana falla.
  Es el objetivo, pero es un **cambio de comportamiento visible** y necesita nota de
  producto y una política decidida (rechazo duro vs apertura con informe de descartes).
- Duplicación aparente en la UI (valida, y el comando revalida) es intencional: la UI valida
  para *explicar*, el comando para *garantizar*.
- Las tolerancias dispersas (`0.05` de margen de extremo, `0.02` de holgura de solape) pasan
  a ser constantes con nombre en dominio. Aparte, la auditoría detectó una **segunda
  política de tolerancia** oculta en geometría: `wallBox.ts:37-39` agrupa endpoints
  redondeando a milímetro mientras `coordinate-system.md` define `EPS_LENGTH = 1e-6`. Eso
  necesita un `JOIN_TOLERANCE` deliberado; queda fuera de este ADR pero anotado.

## Fuera de esta decisión

Familias como catálogo versionado · reglas de códigos de edificación · resolución
automática de conflictos (mover el hueco en vez de rechazarlo) · invariantes de workplanes
(parked) · intersección muro-muro más allá del inglete de ADR 0008 · rendimiento del scene
sync (AX-P2-11: deuda de escalabilidad, no bug) · hardening de importación (SEC-01).
