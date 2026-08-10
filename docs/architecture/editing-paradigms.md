# Paradigmas de edición y referencias espaciales

**Estado:** WP-v1/**v2** · SK-v1 · SK-sel · SK-draw · **SK-profile / SK-replace v0**
cerradas 2026-08-09. **SK-profile-one** (un único perfil al Terminar) = siguiente (auth).
Edit Mode / Family Editor / Push&Pull / losas siguen **parked** (auth).

Separar claramente:

| Paradigma | Uso | No hacer |
|-----------|-----|----------|
| **Parametric Edit** | Props, grips, comandos de elementos BIM; muro en **línea**/cadena | Deformación libre genérica |
| **Sketch Mode** | Perfiles/contornos **solo** sobre un Workplane definido; al confirmar producen **elementos paramétricos** | Malla libre, sólidos no paramétricos, dibujar “en el vacío” sin plano |
| **Edit Mode** | Familias / modelado in-place (futuro) | Ser el editor habitual de puertas/muros |

## Invariante de Sketch Mode (normativa)

**Sketch Mode solo opera con elementos paramétricos sobre un plano de trabajo
definido** (`Workplane` / `SpatialReferenceContext` de WP-v1).

1. Todo trazo de sketch vive en el Workplane activo (hoy: horizontal del storey).
2. El commit del sketch crea o actualiza entidades BIM paramétricas en
   `AxonDocument` (vía comandos); no deja geometría de malla como SoT.
3. Sin Workplane resoluble → no hay Sketch Mode usable (no se inventa un plano
   desde la cámara ni desde la vista).

## Aplicaciones principales (producto)

Sketch Mode **no** es el editor habitual de muros/puertas/ventanas (eso es
Parametric Edit). Su destino principal es dibujar perfiles en el Workplane para
generar o alimentar elementos paramétricos tales como:

| Destino | Rol del sketch |
|---------|----------------|
| **Pisos / losas** | Contorno en planta → losa paramétrica |
| **Terreno** | Perfil / límite en plano de trabajo → terreno paramétrico |
| **Barridos / perfiles** | Perfil 2D en Workplane → barrido u otro sólido paramétrico |
| (otros) | Cualquier tipo BIM cuyo input sea un perfil/contorno en plano |

SK-v1 solo **prueba el patrón** (rectángulo → muros). Losas, terreno y barridos
siguen **fuera de alcance** hasta auth + tipos en el documento.

## Entrada a Sketch Mode sobre elemento activo (contrato UX)

Además del dibujo “en vacío” sobre el Workplane (crear), Sketch Mode se abrirá
**sobre el elemento paramétrico activo/seleccionado** para editar su perfil
cuando el tipo lo soporte (p. ej. contorno de losa).

| Entrada | Comportamiento previsto |
|---------|-------------------------|
| **Doble clic** sobre el elemento en el lienzo | Selecciona (si hace falta) y entra en Sketch Mode de ese elemento |
| **Botón en panel Modificar** | Con selección activa: «Editar perfil» / Sketch del elemento |

Reglas:

- Requiere elemento **activo** (selección) y Workplane resoluble (el del host /
  storey / referencia del elemento — no el plano de la cámara).
- Terminar / Cancelar (Modificar) salen del sketch del elemento y vuelven a
  Parametric Edit; el commit sigue siendo comandos sobre `AxonDocument`.
- **SK-sel + SK-profile (2026-08-09):** doble clic / «Editar perfil» carga el
  **contorno resultante** del sólido en el Workplane activo (huella / cara /
  silueta — no el eje). Ver [`sketch-result-outline.md`](sketch-result-outline.md).
  **Terminar** reemplaza hosts (muros nuevos); **Cancelar** descarta.

## Abstracción: trazo global vs commit por contexto (normativa)

Las herramientas de **Dibujar** son **globales**: producen geometría de sketch
(puntos / polilíneas / arcos tessellados en el Workplane), **no** “crear muro”
como semántica fija.

```
gestos Dibujar  →  builders (@axonbim/tools)  →  perfil / polilínea de sesión
                                                      ↓
                              adaptador de commit (según contexto)
                                 ├── crear muros (cadena / rect / arco)
                                 ├── crear/actualizar losa | terreno | barrido
                                 └── editar perfil del host (reemplazar contorno)
```

| Capa | Responsabilidad |
|------|-----------------|
| **Builders** (`drawArc`, `drawPolyline`, rect, …) | Geometría pura reutilizable |
| **Sesión de perfil** (`sketchProfile`) | Contorno abstracto en Workplane (aristas editables, no el sólido BIM) |
| **Adaptador** | Al confirmar: comandos que **crean** o **reemplazan** (delete + create) hosts |

**Editar perfil (SK-profile / SK-replace v0):** overlay provisional (vértices libres);
host intacto hasta Terminar. Commit actual = delete + create. **Deuda:** huella libre
puede crear **N muros por arista** de la silueta (solape) — no es el objetivo de producto
(un único perfil). Siguiente corte: **SK-profile-one**.
Detalle: [`sketch-result-outline.md`](sketch-result-outline.md).

## Opciones / herramientas de dibujo (reutilización)

Las **opciones de herramienta** y el grupo **Dibujar** que hoy se activan con
**Muro** (Modificar → Línea, Rectángulo, arcos, pick… + Terminar / Cancelar) son
la **misma superficie de dibujo** para Sketch Mode en sus destinos principales
(losas, terreno, barridos, edición de perfil de elemento activo).

| Reutilizar | No hacer |
|------------|----------|
| `drawMode` + cinta Modificar / Dibujar del muro | Segunda barra de dibujo solo para losas/terreno |
| Terminar / Cancelar del mismo panel | Controles duplicados en status u otra pestaña |
| Snap / Workplane ya usados en muro | Snap o plano inventados por tipo de elemento |
| Builders → polilínea; adaptador según contexto | Hardcodear “siempre CreateWall” dentro de cada gesto |

El **resultado** del trazo cambia según el contexto (crear muros vs losa vs
**actualizar perfil del host**); las **herramientas de trazo** no se duplican.
Anti-redundancia UI: [`interface-base.md`](../ui/interface-base.md).

## Principio

Work planes / referencias espaciales = infraestructura compartida (WP-v1/v2:
nivel · superficie · línea en sesión). Los paradigmas **comparten** el
`activeWorkplane` y **no** comparten reglas de edición.

Push & Pull pertenece a **Edit Mode**, no a Parametric Edit ni a Sketch Mode.

## SK-v1 / SK-draw (hecho — Dibujar completo)

| Modo | Comportamiento |
|------|----------------|
| Línea | Paramétrico — cadena de muros |
| Rectángulo | 2 esquinas → 4 muros (`CompositeCommand`) |
| Arco I-F-R | 3 clics → arco tessellado (12 segs) → muros |
| Arco centro | Centro → inicio → fin → arco menor tessellado |
| Pick líneas | Clic muro → P1 en extremo cercano → P2 en plano |
| Pick cara | Clic muro → fija `activeStoreyId` / Workplane del nivel |

API tools: `sampleArcSER` / `sampleArcCE` / `wallAxesFromPolyline` / `wallAxesFromRectangle`.
Preview: `setPreviewRect` / `setPreviewPolyline`. Commit: `commitWallAxes`.
Detalle workplanes: [`workplanes-roadmap.md`](../roadmap/workplanes-roadmap.md).

## SK-sel (hecho — entrada UX)

| Pieza | Comportamiento |
|-------|----------------|
| `sketchTarget` | `{ kind: "wall", id }` en sesión; no en `.axon` |
| Doble clic / **Editar perfil** | Entra Sketch + carga perfil (SK-profile) |
| Workplane | `activeWorkplane` de sesión (storey / surface / line); si es storey, se sincroniza al nivel del host |

## SK-profile (hecho — perímetro en Workplane)

| Pieza | Comportamiento |
|-------|----------------|
| Base | **`activeWorkplane`** — contorno del **resultado** (no el eje); ver [`sketch-result-outline.md`](sketch-result-outline.md) |
| `sketchProfile` | Aristas en el plano activo; overlay + grips (`setProfilePolyline`) |
| Seed | `outlineOnWorkplane` (huella / cara / silueta); sólidos host ocultos |
| Interacción por defecto | Clic/arrastra **vértices libres** del perímetro en el plano activo |
| Rect/arco | Reemplazan el perímetro en el Workplane (redibujar) |
| **Terminar** | `commitSketchProfile` → delete hosts + create (v0; puede N muros por arista) |
| **Cancelar** | Descarta; documento intacto |

API: `outlineOnWorkplane`, `profileFromClosedRing`, `hitProfileVertex`, `moveProfileVertex`, …

**Deuda v0 → SK-profile-one:** el resultado esperado de producto es **un único perfil**
sustituyendo al host, no geometría solapada (silueta → N muros). Ver
[`sketch-result-outline.md`](sketch-result-outline.md).

## Fuera de SK-profile (auth aparte)

- Losas / pisos · terreno · barridos / perfiles de extrusión (aplicaciones principales)
- Arco como entidad curva nativa (hoy = segmentos de muro)
- Edit Mode · Family Editor · Push & Pull
- Sketch que mute malla Three.js
- Commit de perfil vertical como sólido no-muro (hoy Terminar → muros en planta)
