# Contorno resultante en Workplane (sketch)

**Estado:** 2026-08-10 · **SK-replace v0 en código**; objetivo de producto = **un único perfil nuevo** (siguiente corte).

## Objetivo de producto (norma a alcanzar)

Al editar el perfil de un muro (u host futuro):

1. El usuario trabaja un **único perfil imaginario** en sesión (vértices/aristas libres).
2. Hasta **Terminar**, el documento **no** cambia.
3. Si el perfil es válido, **Terminar** materializa **un resultado coherente** que **sustituye** al host — no una nube de muros por cada arista del contorno del sólido.
4. **Cancelar / Esc** descarta; el host original queda intacto.

Hoy el seed sigue siendo la **silueta del sólido** (huella/cara), pero el commit aún puede
**descomponer** esa silueta en N ejes → se percibe como geometría **solapada / multiplicada**
sobre el muro. Eso es **deuda conocida**, no el diseño final.

## Definición (seed)

El **contorno resultante** es la silueta 2D del **sólido derivado** del elemento paramétrico
(hoy: muro caja), proyectada sobre el `activeWorkplane` de sesión.

```
Wall (eje + altura + espesor) → sólido derivado → silueta en activeWorkplane → sketchProfile
                                                          ↑
                    Terminar (objetivo) → 1 perfil → 1 (o cadena explícita) elemento(s) nuevos
```

No es el eje generador. No es la malla Three.js. No es SoT en `.axon`.

---

## Historial de cortes (hecho hasta ahora)

| Corte | Fecha | Qué entregó | Límite / deuda |
|-------|-------|-------------|----------------|
| **SK-v1** | 2026-08-09 | Sketch Mode: rectángulo → 4 muros; paradigma sobre Workplane | Solo prueba de patrón |
| **SK-sel** | 2026-08-09 | Entrada: doble clic / Editar perfil; `sketchTarget` sesión | Solo muro |
| **SK-draw** | 2026-08-09 | Línea · rect · arcos · pick; builders globales | Commit crear ≠ editar perfil |
| **SK-profile** | 2026-08-09 | Seed = contorno **resultado** (no eje); overlay; grips | Commit aún pensado como invert al host |
| **SK-provisional** | 2026-08-09 | Gestos solo sesión; validar al Terminar; Cancelar descarta | Huella 1-corner **constricted** (rectángulo) |
| **SK-replace v0** | 2026-08-09 | Vértices **libres**; Terminar = Delete hosts + Create (nuevos ids); noop si geom igual; openings bloquean | **Huella libre → N muros (1 por arista)** → solape visual / no es “un perfil” |

Detalle de paradigmas: [`editing-paradigms.md`](editing-paradigms.md).
Cola: [`../roadmap/pending-work.md`](../roadmap/pending-work.md).

---

## SK-replace v0 (comportamiento **actual** en código)

Mientras hay `sketchTarget`, el usuario edita un **sketch provisional** en sesión
(vértices y aristas **independientes**). El muro del documento **no** cambia hasta
**Terminar** con perfil válido. Entonces el adaptador **reemplaza**: elimina los
hosts del perfil y crea **muros nuevos** (nuevos ids).

```
outlineOnWorkplane → sketchProfile (sesión, libre)
       ↑                    │
  Dibujar + snap + WP       │ grips (vértices independientes)
                            ▼
                 validateSketchProfileForHost
                     │ ok              │ fail
                     ▼                 ▼
         Delete sources + Create    seguir en Sketch
```

### Reglas fijas (siguen vigentes)

1. Con `sketchTarget` activo, **ningún gesto muta** `AxonDocument` (solo sesión).
2. Overlay = sketch provisional; sólidos host ocultos.
3. **Terminar / Aplicar** = validar → si ok, **replace** (delete + create); si no, mensaje y se conserva el provisional.
4. **Cancelar / Esc** = descartar provisional; documento intacto.
5. Entrada de trazo: herramientas **Dibujar** + **snap** + `activeWorkplane`.
6. Si la geometría propuesta coincide con los hosts → **noop** (sin comandos; se mantiene el sketch).
7. Hosts con puertas/ventanas → Terminar **bloqueado** (replace borraría openings).

### Commit actual (y por qué “solapa”)

| Perfil | Qué hace hoy | Problema de producto |
|--------|--------------|----------------------|
| 1 muro, huella **caja** (`isWallBoxFootprint`) | Invert → **1** muro nuevo | OK como caso especial |
| 1 muro, huella **libre** / sesgada | **Cada arista** → un `CreateWall` | Contorno del sólido ≠ ejes de muro → **N muros** sobre la silueta (solape / traza errónea) |
| 1 muro, WP vertical | Cara → **1** muro nuevo | OK si invert cara funciona |
| Bucle N hosts | Inset anillo → N muros | Coherente para perímetro de local |
| Axes / rect / arco (redibujo) | Aristas → N muros | OK cuando el usuario **dibujó ejes**, no silueta |

**Causa raíz:** se sembró la **silueta del resultado** y, al no ser “caja”, el adaptador la trató como **polilínea de ejes**. Eso multiplica geometría en lugar de producir **un único perfil** sustituyendo al host.

### Validación al Terminar (`validateSketchProfileForHost`) — v0

| Regla | Criterio |
|-------|----------|
| No vacío | ≥1 arista con longitud ≥ `MIN_WALL_LENGTH` |
| Openings | ningún source con huecos |
| Huella caja 1 muro | 4 aristas + `isWallBoxFootprint` → 1 muro vía invert |
| Huella libre 1 muro | (v0) permite axes-por-arista — **a retirar / redefinir** en el siguiente corte |
| 1 muro / vertical | anillo ≥3 pts invertible a cara |
| Bucle | N≥3; inset recuperable |
| Axes / redibujo | aristas usable → muros |

### Edición del provisional (v0)

| Modo | Efecto |
|------|--------|
| Línea (default) | Grips de vértice **libres** + snap |
| Rect / arcos | Reemplazan el provisional (`semantic: "axes"`) |
| Pick líneas | P1/P2 con snap sobre WP → arista provisional |
| Pick cara | Solo Workplane; no pisa el provisional |

---

## Siguiente corte: **SK-profile-one** (nombre de trabajo)

**Meta:** Terminar produce **un único perfil materializado** acorde al contexto, sin
descomponer la silueta del sólido en N muros.

Dirección candidata (a cerrar al autorizar implementación):

| Tema | Dirección |
|------|-----------|
| Semántica del provisional | El perfil es **una** figura (anillo o polilínea), no “lista de muros” implícita |
| Commit 1 host storey | Preferir **1** muro nuevo (eje/espesor desde perfil) **o** rechazar si no es convertible; **no** crear 4 muros perimetrales de la huella |
| Redibujo explícito | Solo Rect/arco/`semantic: "axes"` con intención de cadena → N muros |
| Overlay | Un perfil; al Terminar el host desaparece y aparece **el** resultado nuevo |
| Tests | Oráculo humano: editar 1 muro → Terminar → **1** muro (nuevo id), sin solape de aristas-como-muros |

No implementar hasta frase explícita en chat (p. ej. «autorizo SK-profile-one»).

---

## Por kind de Workplane (seed — vigente)

| `activeWorkplane.kind` | Contorno sembrado |
|------------------------|-------------------|
| `storey` | Huella en planta. Muro suelto → rectángulo **4** aristas. Bucle → anillo **exterior**. |
| `surface` | Rectángulo de la **cara** (largo × altura). |
| `line` | Silueta del prisma (convex hull UV). |

Huecos: contorno del prisma sin recortes (fuera de alcance).

## API canónica (v0)

| Capa | API |
|------|-----|
| Geometría | `outlineOnWorkplane` · `isWallBoxFootprint` · `validateSketchProfileForHost` |
| Perfil sesión | `profileFromClosedRing` · builders (`axes`) · `moveProfileVertex` |
| Seed UI | `enterSketchOnElement` / cancel reseed |
| Commit | `commitSketchProfile` — delete + create (v0; a acotar en SK-profile-one) |

## Oráculos de prueba (v0 + a actualizar)

- Un vértice se mueve solo (no corner constricted).
- Huella caja alargada → Terminar → **nuevo** id, 1 muro.
- Huella libre no-caja → hoy 4 muros (**regresión de producto**; debe pasar a 1 perfil o rechazo en SK-profile-one).
- Perfil inválido → Terminar no muta.
- Snap a endpoint; Cancelar descarta; Rect rebuild provisional hasta Terminar.

## Extensión futura (otros tipos)

Losas / terreno / barridos: misma frontera provisional + validación + adaptador
**un perfil → un elemento** (no N muros por arista de silueta).
Ver [`editing-paradigms.md`](editing-paradigms.md).

## Relación

- Geometría: [`geometry-policy.md`](geometry-policy.md)
- Paradigmas: [`editing-paradigms.md`](editing-paradigms.md)
- Planos: [`../roadmap/workplanes-roadmap.md`](../roadmap/workplanes-roadmap.md)
- Cola: [`../roadmap/pending-work.md`](../roadmap/pending-work.md)
