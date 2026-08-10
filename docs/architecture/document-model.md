# Contrato AxonDocument y formato `.axon`

Contrato F1 + evolución **v2** (perfil vertical de muro, ADR 0018).  
**Código actual (2026-08-10):** escritores → **`.axon` v2** / `Wall.vertical`.
Lectores aceptan v1 (`height` → uniform) y v2 (`vertical` obligatorio).

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
  formatVersion: 1 | 2,  // ver § formato; escritores post–SK-wall-profile-v1 → 2
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

**v1 (código vigente hasta migración):**

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

**v2 (contrato ADR 0018 — `SK-wall-profile-v1`):**

```ts
{
  id: string,
  storeyId: string,
  familyId: string,
  p1: { x: number, y: number, z: number },
  p2: { x: number, y: number, z: number },
  thickness: number,
  vertical:
    | { kind: "uniform"; height: number }
    | { kind: "profile"; outerLoop: { u: number; v: number }[] }
}
```

- `u` = metros desde `p1` hacia `p2`; `v` = metros sobre la base del muro (+Z).
- Un solo bucle exterior; extrusión ± `thickness/2` en la normal horizontal.
- No almacenar `height` suelto junto a `profile`.
- Helpers: `wallVerticalLoop` / `wallMaxHeight` (rectángulo implícito si `uniform`).
- Detalle: [ADR 0018](../decisions/0018-wall-vertical-profile.md).

Semántica (oráculo conceptual del legado `WallSpec`):

- Eje en planta: segmento `p1`–`p2` (proyección XY).
- Longitud de eje `>= MIN_WALL_LENGTH`.
- Definición vertical: uniforme (`height`) **o** perfil U/V (ADR 0018).
- Espesor centrado respecto al eje.
- Huecos: puertas y ventanas hospedadas; deben caber en el sólido vertical (comando).

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

## Formato de archivo `.axon`

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

### `.axon` v1 (vigente en código)

```json
{
  "format": "axon",
  "formatVersion": 1,
  "meta": { "name": "Demo house", "createdAt": "…", "updatedAt": "…" },
  "storeys": [],
  "families": [],
  "doorFamilies": [],
  "windowFamilies": [],
  "walls": [
    {
      "id": "wall.1",
      "storeyId": "storey.default",
      "familyId": "family.block-150",
      "p1": { "x": 0, "y": 0, "z": 0 },
      "p2": { "x": 4, "y": 0, "z": 0 },
      "height": 2.7,
      "thickness": 0.15
    }
  ],
  "doors": [],
  "windows": [],
  "cameras": []
}
```

### `.axon` v2 (ADR 0018 — Bloque 7 entregado 2026-08-10)

- `formatVersion: 2` en nuevos documentos y al serializar.
- Muros con `vertical` discriminado; sin `height` hermano suelto en disco.
- Migración v1→v2: `height` → `{ kind: "uniform", height }` (memoria + re-guardado v2).
- Strict: perfil inválido → reject; v2 con solo `height` → reject.
- Recover: muro con perfil inválido → descartado + warning; **no** degradar a caja.
- Lectores solo-v1 deben **rechazar** v2 con error claro (no campo opcional en v1).

### Migraciones

- `formatVersion` entero monotónico.
- Lectores deben rechazar versiones futuras desconocidas con error claro.
- Migraciones `n → n+1` viven en el paquete de persistencia y se documentan en ADR.
- v1→v2: ADR 0018 (`SK-wall-profile-v1` Bloque 7) — implementada.

### Validación al cargar (strict)

- JSON → `unknown` + validación de forma (arrays, campos, tipos finitos)
- `format === "axon"` y `formatVersion` soportado (`1` | `2`)
- IDs únicos en todo el documento; caps de tamaño (`packages/persistence/src/limits.ts`)
- Predicados de dominio E1/E2 (`validate*` + `validateHostedOpening`; + `validateWallVerticalDefinition`)
- Crop de cámara válido tal cual (sin normalización silenciosa)
- Geometría cumple mínimos de [coordinate-system.md](coordinate-system.md)

### IDs tras importar

Tras Abrir / Demo / Nuevo, la sesión alinea las secuencias `wall.N` / `door.N` / `window.N` al máximo numérico presente (`syncIdSequencesFromDocument`) para evitar colisiones al crear.

## Fuera de v1 / fuera de SK-wall-profile-v1

Historial de undo en disco · IFC · materiales · losas · múltiples documentos enlazados ·
remapeo de perfil al cambiar longitud · joins perfil–perfil complejos