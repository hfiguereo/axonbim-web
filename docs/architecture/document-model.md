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

### WallFamily (catálogo del documento)

```ts
{
  id: "family.light-100" | "family.block-150" | "family.block-200" | string,
  label: string,
  thickness: number  // metros
}
```

**Política F9-E3 (ADR 0017, opción A):** el catálogo vivo es
`document.families` / `doorFamilies` / `windowFamilies`. La UI y los comandos
consumen ese catálogo. Los built-ins de `@axonbim/families` solo **siembran**
documentos nuevos/demo; no son una segunda fuente de verdad en sesión.

Familias built-in (semilla):

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
- Huecos post-MVP: puertas y ventanas hospedadas en el muro (no “opening” genérico en v1).

### Door / Window (post-MVP)

Hospedadas en `wallId`. Ver ADR 0010 / 0011. Al borrar el muro se eliminan y el undo las restaura.

### Camera (post-MVP — ADR 0015 + ADR 0016)

Cámara geométrica: `eye`, `target`, `fov`, `crop` (`ViewCrop`). Colocable en planta; genera vista 3D de sesión ligada (`kind: "camera"`). Sin render. El crop AABB limita lo visible; por defecto activo al crear.

### AxonDocument (en memoria)

```ts
{
  meta: ProjectMeta,
  storeys: Storey[],
  families: WallFamily[],
  doorFamilies: DoorFamily[],
  windowFamilies: WindowFamily[],
  walls: Wall[],
  doors: Door[],
  windows: Window[],
  cameras: Camera[],
  selection?: { wallIds: string[] }  // opcional; puede vivir en capa UI — ver nota
}
```

**Nota selección:** la selección puede residir en estado UI (Zustand) siempre que no se serialice como verdad del edificio. Si se incluye en `.axon`, es conveniencia de sesión, no geometría.

**Nota referencia espacial (WP-v1 / LR3):** `activeStoreyId` y el **Workplane** activo viven en
sesión (derivados de `storeys[]`). No hay entidad `Workplane` en `AxonDocument` ni en `.axon`.
API: `resolveSpatialReference` / `getActiveWorkplane` en `@axonbim/model`. Ver
[coordinate-system.md](coordinate-system.md) y [editing-paradigms.md](editing-paradigms.md).

## Formato de archivo `.axon` v1

Archivo JSON UTF-8, extensión `.axon` (también acepta `.json` con el mismo esquema en importación).

### Política de apertura (F9-E5, híbrido A3)

| Vía UI | API | Comportamiento |
|--------|-----|----------------|
| **Abrir…** | `parseDocument` | Rechazo duro. Sin defaults silenciosos ni `normalizeViewCrop`. |
| **Recuperar copia…** (`.axon.bak` u otros) | `parseDocumentRecover` | Salva lo válido; omite/repara el resto; **informe** en status. |
| **Exportar…** | `serializeDocument` | Solo escribe `.axon` **limpio** (documento en sesión ya válido). |

La copia `.bak` es un rol de rescate, no un segundo formato de trabajo. Tras recuperar, Exportar deja un `.axon` estricto.

### Presentación — crops de vista (ADR 0016)

| Origen | Persistencia |
|--------|----------------|
| `Camera.crop` | Siempre en `cameras[]` |
| Planta / perspectiva libre con crop **activado** | `presentation.viewCrops[viewId]` |
| Crop desactivado | No se escribe |

El crop es control de encuadre de presentación, no decoración.

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
  "doorFamilies": [],
  "windowFamilies": [],
  "walls": [],
  "doors": [],
  "windows": [],
  "cameras": []
}
```

### Migraciones

- `formatVersion` entero monotónico.
- Lectores deben rechazar versiones futuras desconocidas con error claro.
- Migraciones `n → n+1` viven en el paquete de persistencia (futuro) y se documentan en ADR.
- v1 no tiene migraciones previas.

### Validación al cargar (strict)

- JSON → `unknown` + validación de forma (arrays, campos, tipos finitos)
- `format === "axon"` y `formatVersion === 1`; claves de catálogo/entidades presentes
- IDs únicos en todo el documento; caps de tamaño (`packages/persistence/src/limits.ts`)
- Predicados de dominio E1/E2 (`validate*` + `validateHostedOpening`)
- Crop de cámara válido tal cual (sin normalización silenciosa)
- Geometría cumple mínimos de [coordinate-system.md](coordinate-system.md)

### IDs tras importar

Tras Abrir / Demo / Nuevo, la sesión alinea las secuencias `wall.N` / `door.N` / `window.N` al máximo numérico presente (`syncIdSequencesFromDocument`) para evitar colisiones al crear.

## Fuera de v1

Historial de undo en disco · IFC · materiales · losas · múltiples documentos enlazados
