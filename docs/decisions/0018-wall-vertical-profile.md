# ADR 0018 — Perfil vertical persistente de muro (`SK-wall-profile-v1`)

## Estado

**Aceptado (contrato)** — Bloque 1 autorizado 2026-08-10.  
**Bloque 2 (dominio puro)** — entregado 2026-08-10: tipos + helpers + validación + tests en
`@axonbim/model` (`wallVertical.ts`).  
**Bloque 3 (geometría)** — entregado 2026-08-10: `wallProfileMesh` / metrics / joins fallback
(`wallProfileSupportsMiter`); openings (notch sill=0 + slabs en perfil rectangular).  
**Bloque 4 (comando)** — entregado 2026-08-10: `Wall.vertical` (sin `height` suelto);
`SetWallVerticalProfileCommand` in-place + Undo/Redo mismo `wallId`; locks
`heightLocked` / `lengthLocked`; openings reject-or-keep.  
**Bloque 5 (vista / picking)** — entregado 2026-08-10: `WallHit` + gate planta/cámara;
`workplaneFromWallFace` al entrar; WP congelado en sketch; grips en U/V/N.  
**Bloque 6 (editor + toolkit)** — entregado 2026-08-10: Terminar →
`SetWallVerticalProfileCommand` (mismo `wallId`); toolkit Modificar
(mover / split point·line / rotar / fillet / copiar) con SnapSession + Workplane;
Redibujar limpia provisional.  
**Bloque 7 (persistencia)** — entregado 2026-08-10: `.axon` `formatVersion: 2`;
migración v1 `height` → `vertical`; escritor siempre `vertical` (sin `height` suelto);
validación estricta de perfil; recover descarta muro inválido con warning (no caja silenciosa);
Properties: altura solo lectura si `kind === "profile"`.  
**`SK-wall-profile-v1` cerrado** (código + tests + docs). Checklist humana final opcional
en matriz `04_…` (guardar/reabrir visual).

Diagnóstico Bloque 0:
[`../validation/sk-wall-profile-bloque0-2026-08-10.md`](../validation/sk-wall-profile-bloque0-2026-08-10.md).

## Contexto

El croquis de producto (Modo SK) y la auditoría externa 2026-08-10 exigen editar el
**contorno vertical** de un muro (pendiente, escalón) de forma que sobreviva a Terminar,
Undo/Redo y guardar/reabrir.

**SK-profile-one** (2026-08-10) eliminó silueta→N muros, pero el dominio sigue siendo
`Wall.height` uniforme + `wallBoxMesh` + commit Delete+Create. `invertVerticalFaceOutline`
colapsa cualquier bucle a AABB (`uMin/uMax/vMin/vMax`). Eso **no** cumple el croquis.

Restricciones vigentes: `AxonDocument` SoT (ADR 0002); sin kernel CAD en este corte
(ADR 0004 / 0013 parked); invariantes en comandos (ADR 0017).

## Decisión

### 1. Nombre del bloque

**`SK-wall-profile-v1`** sustituye, para el caso “un muro / perfil vertical”, el alcance
insuficiente de “un muro caja al Terminar” de SK-profile-one. SK-profile-one permanece
como regla anti-descomposición de silueta en planta.

### 2. Definición discriminada (una verdad vertical)

```ts
type WallProfilePoint = {
  /** Metros sobre el eje local desde p1 hacia p2. */
  u: number;
  /** Metros sobre la base del muro (elevación local). */
  v: number;
};

type WallVerticalDefinition =
  | { kind: "uniform"; height: number }
  | { kind: "profile"; outerLoop: WallProfilePoint[] };

type Wall = {
  id: string;
  storeyId: string;
  familyId: string;
  p1: Vec3;
  p2: Vec3;
  thickness: number;
  vertical: WallVerticalDefinition;
};
```

Prohibido mantener `height` suelto **y** un perfil custom como dos verdades divergentes.
Helpers (`wallVerticalLoop`, `wallMaxHeight`) exponen el rectángulo implícito cuando
`kind === "uniform"`.

### 3. Sistema de coordenadas local U/V

| Eje | Definición |
|-----|------------|
| Origen | `p1` en la elevación base del muro (`min(p1.z, p2.z)` alineada al storey del muro) |
| U | Dirección normalizada `p1 → p2` en planta |
| V | `+Z` mundial |
| N | Normal horizontal del muro (derecha respecto a U) |

- El perfil es **un** bucle 2D en U/V (coordenadas de muro, no de cámara ni Workplane de sesión).
- El sólido derivado = extrusión del bucle en `± thickness/2` sobre N.
- No es SoT la malla Three.js ni el overlay de sketch.

### 4. Política de longitud con perfil custom

Para `vertical.kind === "profile"` en v1:

- Cambiar la longitud del eje (`p1`/`p2`) **se rechaza** con error explícito hasta que
  exista un corte documentado de remapeo U.
- Motivo: evita estirar/comprimir el dibujo sin política de producto.

Muros `uniform`: longitud editable como hoy (Parametric Edit).

### 5. Política de altura en Properties

| Definición | UI “Altura” |
|------------|-------------|
| `uniform` | Editable; muta `vertical.height` vía comando existente / equivalente |
| `profile` | **Solo lectura** = `wallMaxHeight` (máx. V del bucle). No sobrescribe el perfil. |
| Restablecer | Acción explícita «Restablecer perfil rectangular» → `uniform` con altura = máx. actual (comando; entrada de historial) |

### 6. Openings (puertas / ventanas)

- Conservan `id` y `wallId` si el rectángulo U/V del hueco queda **dentro** del sólido del perfil.
- Si el perfil propuesto deja un opening fuera o lo corta → el comando **rechaza**; no borra,
  no mueve, no recorta silenciosamente.
- Validación en dominio (comando), no solo en UI (ADR 0017).

### 7. Comando in-place

```ts
SetWallVerticalProfileCommand(wallId, nextVertical)
```

- Conserva `wallId`, familia, espesor, storey, openings válidos.
- `noop` si equivalencia geométrica dentro de tolerancia.
- `rejected` con código estructurado si falla validación.
- **Prohibido** usar DeleteWall + CreateWall para editar el perfil de un solo muro.
- Snapshot profundo para Undo/Redo.

### 8. Entrada de vista (contrato UX)

| Vista | Perfil vertical |
|-------|-----------------|
| `ViewKind === "plan"` | **Rechazada** (mensaje; documento intacto) |
| Elevación ortográfica / preset frontal-lateral usable | Permitida |
| Perspectiva / isométrica 3D | Permitida tras hit de **cara** (`WallHit`) |
| Cámara documental | Por defecto no inicia edición de perfil salvo contrato UI futuro |

Al entrar: fijar Workplane de la cara (`workplaneFromWallFace`); no cambiarlo al orbitar.
Elevaciones formales LR4 **no** se abren en este bloque: solo el contexto de vista necesario.

### 9. Persistencia `.axon` → `formatVersion: 2`

| Paso | Comportamiento |
|------|----------------|
| Lector v1 | `height` → `{ kind: "uniform", height }` en memoria / migración a v2 |
| Escritor v2 | Serializa `vertical`; **no** escribe `height` suelto junto a perfil |
| Lector v2 | Valida perfil con predicados de dominio |
| Recover | Perfil inválido → informe; **no** degradar silenciosamente a caja |
| Lectores antiguos | No se mantiene v1 con campo opcional que se pierda al re-guardar |

Migración en `@axonbim/persistence` (Bloque 7, 2026-08-10): lector acepta 1|2;
memoria/escritura siempre v2. Abrir v2 con lector solo-v1 = error claro (no campo opcional en v1).

### 10. Geometría derivada (alcance v1)

- Generador `wallProfileMesh` (polígono U/V extruido; openings como huecos rectangulares).
- Muros `uniform` pueden seguir el camino caja como optimización **si** consumen el mismo
  contrato (`wallVerticalLoop`).
- Joins (ADR 0008): inglete actual solo para pares **uniform**; con perfil custom → fallback
  documentado (sin inglete automático inválido) hasta corte de joins perfilados.
- Sin OpenCascade.

### 11. Relación con Sketch Mode

- Contorno vertical = Sketch Mode sobre Workplane de cara.
- Eje / espesor / familia = Parametric Edit.
- Provisional en sesión hasta Terminar; host visible oculto / overlay = contorno.
- Herramientas: editar vértices vs **Redibujar** (limpia provisional, no el documento).
- **Bloque 6 ampliado:** toolkit Modificar (mover / **split point** / **split line** /
  rotar / fillet / copiar [/ desfase]) sobre el provisional; **siempre** con
  **SnapSession** + **Workplane** activo (misma invariante que el dibujo). No es Edit Mode.
- Línea no debe `appendProfileEdge` sobre semilla cerrada como semántica principal.

## Consecuencias

- Cambio de forma de `Wall` y de `.axon` (v2): requiere Bloques 2–7 + tests de migración.
- Properties, envelope, framing, openings y viewer deben leer `vertical` / helpers.
- SK-profile-one sigue válido para huella en planta; el croquis vertical vive aquí.
- Edit Mode / Push&Pull / losas / Family Editor: **fuera** de este ADR.

## Fuera de este ADR (auth aparte)

- Remapeo de perfil al cambiar longitud.
- Múltiples bucles / islas dibujadas por el usuario.
- Joins complejos entre dos perfiles custom.
- Alzado documental completo (LR4).
- IFC openings / OCCT.

## Referencias

- Paquete: [`../validation/sk-wall-profile-report-2026-08-10/`](../validation/sk-wall-profile-report-2026-08-10/)
- Croquis / outline: [`../architecture/sketch-result-outline.md`](../architecture/sketch-result-outline.md)
- Paradigmas: [`../architecture/editing-paradigms.md`](../architecture/editing-paradigms.md)
- Modelo: [`../architecture/document-model.md`](../architecture/document-model.md)
- Geometría: [`../architecture/geometry-policy.md`](../architecture/geometry-policy.md)
- Cola: [`../roadmap/pending-work.md`](../roadmap/pending-work.md)
