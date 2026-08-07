# Contrato AxonDocument y formato `.axon` v1

Contrato F1. Fuente de verdad del proyecto en sesión y en disco.

## Principios

- `AxonDocument` es la única fuente de verdad del modelo.
- No importa React, Three.js, DOM, IndexedDB ni IFC.
- Toda mutación confirmada llega vía comandos.
- IDs de elemento son estables durante la vida del documento (y tras reabrir el mismo archivo, salvo migración que documente lo contrario).

## Política de IDs

| Campo | Regla |
|-------|-------|
| `id` | String opaco, único en el documento. Formato recomendado: UUID v4 (sin dependencia de orden). |
| Asignación | Al crear la entidad en un comando `execute`. |
| Estabilidad | No se reutiliza un `id` borrado dentro de la misma sesión de historial de forma ambigua; redo recrea con el mismo `id` cuando el comando lo conserve. |
| Topología B-Rep | **Fuera del MVP.** No hay `topo_id` de caras/aristas como contrato público. |

## Entidades MVP

### ProjectMeta

```ts
{
  format: "axon",
  formatVersion: 1,
  name: string,
  createdAt: string,  // ISO-8601
  updatedAt: string
}
```

### Storey

```ts
{
  id: string,
  name: string,
  elevation: number  // metros; MVP default 0
}
```

### WallFamily (catálogo embebido o referenciado)

```ts
{
  id: "family.light-100" | "family.block-150" | "family.block-200" | string,
  label: string,
  thickness: number  // metros
}
```

Familias built-in:

| id | label | thickness |
|----|-------|-----------|
| `family.light-100` | Muro ligero | 0.10 |
| `family.block-150` | Bloque 150 | 0.15 |
| `family.block-200` | Bloque 200 | 0.20 |

### Wall

```ts
{
  id: string,
  storeyId: string,
  familyId: string,
  p1: { x: number, y: number, z: number },
  p2: { x: number, y: number, z: number },
  height: number,
  thickness: number  // copia efectiva; puede diferir si el usuario personaliza
}
```

Semántica (oráculo conceptual del legado `WallSpec`):

- Eje en planta: segmento `p1`–`p2` (proyección XY).
- Longitud de eje `>= MIN_WALL_LENGTH`.
- Altura extruye en **+Z** desde `min(p1.z, p2.z)`.
- Espesor centrado respecto al eje.
- **Sin openings en MVP.**

### AxonDocument (en memoria)

```ts
{
  meta: ProjectMeta,
  storeys: Storey[],
  families: WallFamily[],
  walls: Wall[],
  selection?: { wallIds: string[] }  // opcional; puede vivir en capa UI — ver nota
}
```

**Nota selección:** la selección puede residir en estado UI (Zustand) siempre que no se serialice como verdad del edificio. Si se incluye en `.axon`, es conveniencia de sesión, no geometría.

## Formato de archivo `.axon` v1

Archivo JSON UTF-8, extensión `.axon` (también acepta `.json` con el mismo esquema en importación).

```json
{
  "format": "axon",
  "formatVersion": 1,
  "meta": {
    "name": "Demo house",
    "createdAt": "2026-08-06T00:00:00.000Z",
    "updatedAt": "2026-08-06T00:00:00.000Z"
  },
  "storeys": [
    { "id": "storey.default", "name": "Nivel 1", "elevation": 0 }
  ],
  "families": [
    { "id": "family.light-100", "label": "Muro ligero", "thickness": 0.1 },
    { "id": "family.block-150", "label": "Bloque 150", "thickness": 0.15 },
    { "id": "family.block-200", "label": "Bloque 200", "thickness": 0.2 }
  ],
  "walls": []
}
```

### Migraciones

- `formatVersion` entero monotónico.
- Lectores deben rechazar versiones futuras desconocidas con error claro.
- Migraciones `n → n+1` viven en el paquete de persistencia (futuro) y se documentan en ADR.
- v1 no tiene migraciones previas.

### Validación al cargar

- `format === "axon"` y `formatVersion === 1`
- Al menos un storey
- Cada muro referencia `storeyId` y `familyId` existentes
- Geometría cumple mínimos de [coordinate-system.md](coordinate-system.md)

## Fuera de v1

Historial de undo en disco · IFC · materiales · openings · losas · múltiples documentos enlazados
