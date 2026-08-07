# Comandos e historial

## Contrato

```ts
interface Command {
  readonly id: string           // id de instancia de comando (historial)
  readonly type: string         // ej. "wall.create"
  execute(doc: AxonDocument): void
  undo(doc: AxonDocument): void
}
```

- `execute` aplica la mutación y deja el documento válido.
- `undo` restaura el estado previo de esa mutación.
- Fallo de validación → no se apila en el historial; error explícito a la UI.

## Historial en sesión (MVP)

```ts
interface HistoryStack {
  undoStack: Command[]
  redoStack: Command[]
  push(cmd: Command): void  // execute + clear redo
  undo(): void
  redo(): void
}
```

- No se usa SQLite como almacén canónico (lección del desktop).
- Persistencia del historial en disco: **fuera del MVP**.
- Previews de herramientas **nunca** llaman `push`.

## Comandos MVP previstos

| type | execute | undo |
|------|---------|------|
| `wall.create` | Añade muro | Elimina por id |
| `wall.delete` | Elimina muro (guarda snapshot) | Restaura muro |
| `wall.setHeight` | Cambia height | Restaura height |
| `wall.setThickness` | Cambia thickness | Restaura thickness |
| `wall.setFamily` | Cambia familyId (+ thickness de familia si aplica) | Restaura |
| `project.replace` | Carga documento (abrir/demo) | Documento anterior |

Agrupación: un gesto confirmado = un comando (o un comando compuesto documentado). No micro-comandos por cada pixel de drag.

## Relación con UI

```
React/Tool → crea Command → History.push → documento cambia → viewers se refrescan
```

React/Zustand pueden guardar: herramienta activa, puntos de preview, cámara.  
No pueden escribir `walls[]` directamente.
