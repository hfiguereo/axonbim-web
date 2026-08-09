# Comandos e historial

Contrato vigente (F9-E1 / ADR 0017). La API antigua `execute(doc): void` / `push(cmd): void`
**no existe**.

## Contrato

```ts
type CommandResult =
  | { ok: true; changed: true }
  | { ok: true; changed: false; code: "noop" }
  | { ok: false; code: string; message: string };

interface Command {
  readonly id: string           // id de instancia de comando (historial)
  readonly type: string         // ej. "wall.create"
  execute(doc: AxonDocument): CommandResult
  undo(doc: AxonDocument): void
}
```

- `execute` aplica la mutación **solo** si deja el documento válido (ADR 0017).
- `undo` restaura el estado previo de esa mutación.
- Tres resultados distintos (no un `boolean`):
  - **changed** → se apila en el historial y limpia el redo.
  - **noop** → mismo valor; no es error; mensaje «Sin cambios…».
  - **rechazo** → invariante violada; documento intacto; redo intacto; la UI muestra el motivo.
- Predicados de dominio en `@axonbim/model` (`validateWall`, `validateDoor`,
  `validateHostedOpening`, …); los comandos y la persistencia los comparten.

## Historial en sesión

```ts
interface HistoryStack {
  undoStack: Command[]
  redoStack: Command[]
  push(cmd: Command, doc: AxonDocument): CommandResult  // solo apila si changed
  undo(doc: AxonDocument): void
  redo(doc: AxonDocument): void
}
```

- No se usa SQLite como almacén canónico (lección del desktop).
- Persistencia del historial en disco: **fuera del alcance actual**.
- Previews de herramientas **nunca** llaman `push`.

## Comandos implementados

| type | execute | undo |
|------|---------|------|
| `wall.create` / `wall.delete` / `wall.setHeight` / `wall.setThickness` / `wall.setFamily` | Mutación + validación de dominio | Restaura |
| `door.*` / `window.*` | Refs, enums, tamaños, fit/solape (E2) | Restaura |
| `camera.*` | FOV, eye≠target, crop, pose | Restaura |

Agrupación: un gesto confirmado = un comando (o un comando compuesto documentado). No micro-comandos por cada pixel de drag.

## CompositeCommand (LR2)

```ts
new CompositeCommand(type, steps: Command[])
```

- Una acción lógica del usuario → **una** entrada en `HistoryStack`.
- `execute`: corre los pasos en orden; si uno **rechaza**, deshace los que ya mutaron y
  devuelve el rechazo (documento intacto; redo del historial no se toca).
- Solo pasos con `changed` participan en `undo` / redo.
- Si todos son noop → `noop` (no se apila).
- Uso inicial: contrato + tests; features Sketch/Edit lo adoptarán cuando existan.

## Relación con UI

```
React/Tool → crea Command → History.push → documento cambia → viewers se refrescan
```

React/Zustand pueden guardar: herramienta activa, puntos de preview, vistas de sesión
(planta / perspectiva libre). Las pestañas `kind=camera` se **derivan** de
`document.cameras` tras cada mutación (F9-E4). Crops de planta/perspectiva **activados**
se serializan en `presentation.viewCrops` al exportar (ADR 0016).
No pueden escribir `walls[]` / `cameras[]` directamente.
La UI puede validar *antes* para mensajes amables; el comando **siempre** revalida.
