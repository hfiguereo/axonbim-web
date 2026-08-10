# Bloque 0 — diagnóstico reproducible: perfil vertical de muro

**Fecha:** 2026-08-10  
**Bloque:** `SK-wall-profile-v1` / Bloque 0 (sin código productivo)  
**Fuente de requisitos:** [`sk-wall-profile-report-2026-08-10/`](./sk-wall-profile-report-2026-08-10/)  
**Estado del repo al diagnosticar:** `main` con **SK-profile-one** ya en código (rechazo silueta→N muros); el croquis de pendiente/escalón **sigue sin persistir**.

**Parada obligatoria:** no abrir Bloque 1 (ADR/contrato) sin aprobación explícita.

---

## 1. Reproducción del fallo de producto

Escenario (equivalente a croquis / informe §resultado esperado):

1. Muro rectangular sin openings (`p1–p2`, `height`, `thickness`).
2. Workplane de **cara vertical** (surface) o vista 3D con cara seleccionada.
3. Mover un vértice superior del provisional → pendiente (p. ej. `(0,0)→(4,0)→(4,2)→(0,3)` en U/V).
4. **Terminar**.

**Resultado observable hoy:**

- El provisional puede mostrar la pendiente.
- Tras Terminar, el documento tiene un muro con solo `height` uniforme (= envolvente V).
- La malla vuelve a ser un prisma caja (`wallBoxMesh`).
- El `wallId` **cambia** (Delete + Create).

---

## 2. Evidencia: `invertVerticalFaceOutline` colapsa a AABB

Archivo: `packages/geometry/src/wallResultOutline.ts` (`invertVerticalFaceOutline`).

Algoritmo real: proyecta puntos a UV y conserva **solo** `uMin/uMax/vMin/vMax`; retorna base + `height = vMax - vMin`.

Reproducción numérica (pendiente 4 puntos):

| Entrada UV | Salida del invert |
|------------|-------------------|
| `(0,0), (4,0), (4,2), (0,3)` | `u∈[0,4]`, `v∈[0,3]` → **height = 3** |

La arista superior inclinada **desaparece**. Un escalón con 6 vértices colapsa igual a un rectángulo envolvente.

---

## 3. Evidencia: commit materializa otro `Wall` sin perfil

Archivo: `apps/web/src/session/commitSketchProfile.ts`

Para `semantic !== "axes"` + 1 host + WP `surface`/`line`:

1. Llama `invertVerticalFaceOutline(ring, wp)`.
2. Construye un `Wall` nuevo (`createWallId()`, `height: face.height`, sin campo de perfil).
3. `replaceSourcesWithWalls` → `CompositeCommand("sketch.profile.replace", [DeleteWall…, CreateWall…])`.

El contorno dibujado **no** llega a `AxonDocument`.

Tras **SK-profile-one**: huella libre en planta ya **no** crea N muros (rechazo). Eso no corrige la pérdida del perfil vertical.

---

## 4. Evidencia: el modelo no puede guardar el perfil

`packages/model/src/types.ts`:

```ts
type Wall = {
  id: string;
  storeyId: string;
  familyId: string;
  p1: Vec3;
  p2: Vec3;
  height: number;
  thickness: number;
};
```

`packages/geometry/src/wallBox.ts`: `z1 = z0 + wall.height` — siempre prisma rectangular.

No existe `SetWallVerticalProfileCommand` (sí existen ediciones in-place de ejes: p. ej. `SetWallEndpointsCommand`).

---

## 5. Pruebas que protegen (o documentan) el contrato actual

| Archivo | Qué protege | Acción prevista en v1 |
|---------|-------------|------------------------|
| `apps/web/src/session/sketchProfileSession.test.ts` — *Terminar replaces host: new wall id…* | Delete+Create + **nuevo id** | Sustituir por oráculo **mismo id** + perfil persistente |
| `apps/web/src/session/sketchProfileSession.test.ts` — *free non-rect… stays in sketch* | SK-profile-one: rechazo N muros | Mantener rechazo en planta; perfil vertical = otro camino |
| `packages/geometry/src/sketchProfileValidate.test.ts` — openings / footprint.one | Bloqueo openings + no axes-on-replace | Openings: validar dentro del perfil (no bloquear por existir) |
| `apps/web/src/session/workplaneV2Session.test.ts` | Vértices en plano surface | Ampliar: Terminar conserva bucle irregular |
| *(ausente)* | Pendiente/escalón tras Terminar / Undo / `.axon` | Añadir oráculos de la matriz `04_…` |

Ninguna prueba actual exige que un perfil irregular **sobreviva** a Terminar.

---

## 6. Discrepancia docs ↔ producto ↔ croquis

| Fuente | Dice |
|--------|------|
| Croquis + paquete externo | Perfil vertical persistente; solo elevación/3D; mismo id; openings |
| `sketch-result-outline.md` (SK-profile-one) | Un muro convertible **o rechazo**; escalonado = parked |
| Código | Caja + `height`; replace; planta aún entra (hint de status) |

**Conclusión Bloque 0:** SK-profile-one fue un corte útil anti-solape, pero **no** cumple el croquis. El siguiente bloque de producto debe ser **`SK-wall-profile-v1`** según el paquete archivado — no un parche a `invertVerticalFaceOutline`.

---

## 7. Mapa de archivos afectados (previsto; sin editar aún)

| Capa | Archivos principales |
|------|----------------------|
| Modelo | `packages/model/src/types.ts`, `validate.ts`, `openingFit.ts`, `modelEnvelope.ts` |
| Commands | `packages/commands/src/walls.ts` (+ nuevo `SetWallVerticalProfileCommand`), tests |
| Geometry | `wallBox.ts`, `openings.ts`, nuevo `wallProfileMesh`, `wallResultOutline.ts`, validate |
| Tools | `packages/tools/src/sketchProfile.ts` |
| Session | `sketchToolSlice.ts`, `commitSketchProfile.ts`, tipos de vista/picking |
| Viewer | pick → `WallHit`, overlay/grips en ejes locales, sync malla |
| UI | `Viewport`/`Ribbon` (bloquear planta), `PropertiesPanel` (altura vs perfil) |
| Persistence | shape/parse/serialize + migración `formatVersion` |
| Docs | ADR nuevo, `sketch-result-outline`, paradigmas, `pending-work`, `AGENTS.md`, CHANGELOG |

---

## 8. Diff propuesto (alcance; no aplicado)

Orden de la cadena (`03_CADENA_…`):

0. ~~Diagnóstico~~ (**este documento**) — **PARADA**.
1. ADR + contrato `WallVerticalDefinition` + política `.axon` v2 + cola `SK-wall-profile-v1`.
2. Dominio puro + validación + tests.
3. Geometría `wallProfileMesh` (+ openings).
4. `SetWallVerticalProfileCommand` in-place.
5. Vista/picking/Workplane (bloquear planta).
6. Editor provisional (editar vs redibujar) + commit al comando nuevo.
7. Persistencia + integración + checklist humana.

**Atajos prohibidos (paquete):** no solo mover `height`; no N muros por arista; no Delete+Create para un muro; no SoT en Three/Zustand; no OCCT; no `.axon` v1 con campo opcional que lectores antiguos destruyan al guardar.

---

## 9. Qué no se hizo en Bloque 0

- Ningún cambio de código productivo.
- Ningún ADR nuevo.
- Ninguna migración `.axon`.
- No se reabrió implementación de SK-profile-one.

---

## 10. Gate — decisión pedida

**Bloque 0:** aprobado al autorizar Bloque 1 (2026-08-10).  
**Bloque 1:** ADR 0018 + contrato documental entregados — ver
[`../decisions/0018-wall-vertical-profile.md`](../decisions/0018-wall-vertical-profile.md).

Siguiente: autorizar **Bloque 2** (dominio y pruebas puras; sin viewer).
