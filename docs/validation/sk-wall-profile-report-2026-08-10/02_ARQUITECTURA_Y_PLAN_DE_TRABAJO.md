# Arquitectura propuesta y plan de trabajo

## 1. Nombre y objetivo del bloque

**Nombre recomendado:** `SK-wall-profile-v1`

**Objetivo:** permitir que un muro conserve un contorno vertical no rectangular dibujado sobre su cara, manteniendo su identidad paramétrica, espesor, familia, nivel, historial y elementos hospedados.

Este bloque reemplaza el alcance insuficiente de `SK-profile-one` para el caso específico de un solo muro.

## 2. Separación de paradigmas

La función debe respetar las decisiones arquitectónicas previas:

| Operación | Paradigma |
|---|---|
| Posición y longitud del eje `p1/p2` | Parametric Edit |
| Espesor y familia | Parametric Edit |
| Contorno vertical exterior | Sketch Mode |
| Puertas y ventanas | Parametric Edit de elementos hospedados |
| Extrusión libre de caras | Edit Mode futuro; no pertenece a este bloque |

“Dibujo libre” significa libertad dentro del plano vertical local del muro, no deformación libre de la malla ni Push & Pull.

## 3. Contrato de datos propuesto

Evitar dos fuentes de verdad como `height` y `profile` simultáneos sin relación formal. Usar una definición discriminada:

```ts
export type WallProfilePoint = {
  /** Metros sobre el eje local desde p1 hacia p2. */
  u: number;
  /** Metros sobre la base del muro. */
  v: number;
};

export type WallVerticalDefinition =
  | {
      kind: "uniform";
      height: number;
    }
  | {
      kind: "profile";
      outerLoop: WallProfilePoint[];
    };

export type Wall = {
  id: string;
  storeyId: string;
  familyId: string;
  p1: Vec3;
  p2: Vec3;
  thickness: number;
  vertical: WallVerticalDefinition;
};
```

### 3.1 Sistema local

- Origen: `p1` en la elevación base del muro.
- Eje U: dirección normalizada `p1 → p2`.
- Eje V: `+Z` mundial.
- Eje N: normal horizontal del muro.
- Perfil: un bucle 2D en U/V.
- Sólido: extrusión del perfil en `± thickness / 2` sobre N.

El perfil no se guarda en coordenadas de cámara, pantalla ni Workplane de sesión.

### 3.2 Compatibilidad paramétrica inicial

Para `v1`:

- `0 ≤ u ≤ wallLength`;
- `v ≥ 0`;
- el contorno debe alcanzar ambos extremos `u = 0` y `u = wallLength` dentro de tolerancia;
- cambiar la longitud del muro con perfil personalizado debe rechazarse hasta que exista una política explícita de remapeo, o debe implementarse una regla documentada y probada;
- la propiedad “Altura” de un perfil personalizado se muestra como altura máxima calculada y no puede sobrescribir silenciosamente el perfil;
- debe existir una acción explícita “Restablecer perfil rectangular”.

Esto evita que editar el perfil altere implícitamente el eje o que cambiar la altura destruya el dibujo.

## 4. Helpers puros de dominio

Crear APIs sin dependencias de React, Three.js o DOM:

```ts
wallLength(wall)
wallVerticalLoop(wall)
wallMaxHeight(wall)
wallLocalToWorld(wall, { u, v, n })
worldToWallProfileUV(wall, point)
validateWallProfile(wall, profile)
openingRectangleUV(opening)
validateOpeningInsideWallProfile(wall, opening)
```

`wallVerticalLoop()` debe producir el rectángulo implícito cuando `kind === "uniform"`, de modo que geometría, viewer y validación consuman una sola API.

## 5. Invariantes del perfil

El predicado de dominio debe rechazar:

- menos de tres vértices;
- coordenadas no finitas;
- aristas inferiores a tolerancia;
- vértices consecutivos duplicados;
- bucle abierto;
- área menor que `EPS_AREA`;
- autointersecciones;
- múltiples islas;
- puntos fuera de `[0, wallLength]` en U;
- puntos debajo de la base en V;
- perfil que no alcance ambos extremos del muro;
- puertas o ventanas fuera del área sólida;
- intersección entre el contorno exterior y un opening.

La orientación del bucle puede normalizarse de forma determinista, pero no debe corregirse silenciosamente una forma inválida.

## 6. Comando de dominio

Crear:

```ts
SetWallVerticalProfileCommand(wallId, nextVertical)
```

Responsabilidades:

1. localizar el muro;
2. detectar `noop` mediante equivalencia geométrica con tolerancia;
3. validar el muro candidato;
4. validar todas las puertas y ventanas hospedadas contra el perfil candidato;
5. mutar únicamente `wall.vertical`;
6. conservar ID, familia, espesor, storey y hosted IDs;
7. guardar snapshot profundo para Undo;
8. retornar un error estructurado si falla.

No debe:

- eliminar el muro;
- crear otro ID;
- mover openings automáticamente;
- recortar el perfil automáticamente;
- guardar una malla.

## 7. Generación de geometría

### 7.1 Muro sin openings

Crear un generador especializado:

```ts
wallProfileMesh(wall, options?) -> MeshBuffer
```

Algoritmo:

1. obtener el bucle U/V;
2. validar/precondicionar;
3. crear copia frontal y posterior a `± thickness / 2`;
4. triangular ambas tapas;
5. crear quads laterales por cada arista exterior;
6. transformar los vértices locales a mundo;
7. calcular normales consistentes.

### 7.2 Openings hospedados

Puertas y ventanas se representan como rectángulos internos en U/V.

El generador necesita triangulación de un polígono 2D con huecos o un algoritmo especializado equivalente. Esto no requiere un kernel CAD general.

Reglas:

- los openings continúan definidos por `centerOffset`, `width`, `sill` y `height`;
- el comando garantiza que sus cuatro esquinas estén dentro del contorno;
- la geometría asume inputs válidos;
- si la implementación se divide en cortes, el bloque no puede declararse terminado hasta conservar openings.

### 7.3 Joins

Los ingletes existentes se desarrollaron para cajas de altura uniforme. Para el primer corte:

- mantener joins actuales para muros uniformes;
- definir explícitamente el comportamiento de joins cuando uno de los muros tenga perfil personalizado;
- no aplicar automáticamente el inglete de caja si produce caras inválidas;
- documentar un fallback controlado antes de implementarlo.

## 8. Contrato de vista y Workplane

### 8.1 Entrada permitida

- `plan`: rechazada para perfil vertical.
- elevación ortográfica lateral: permitida.
- perspectiva/isométrica 3D: permitida tras seleccionar una cara del muro.
- cámara: decidir explícitamente; por defecto, sólo lectura si no existe edición de cámara compatible.

### 8.2 Hit enriquecido

Extender el adaptador de picking para obtener un resultado efímero:

```ts
type WallHit = {
  wallId: string;
  face: "front" | "back";
  point: Vec3;
  normal: Vec3;
};
```

El `WallHit` no es SoT. Sirve para resolver:

```ts
workplaneFromWallFace(wall, hit.face)
```

### 8.3 Sesión estable

Al entrar:

- fijar el Workplane de la cara;
- proyectar la cámara/puntero sobre él;
- no cambiar el Workplane por orbitar;
- salir o pedir confirmación si el usuario intenta cambiar de plano durante el sketch.

Las elevaciones pueden formalizarse como `ViewKind` propio o mediante un `ViewEditContext` estable. No abrir por accidente todo LR4 de documentación técnica; implementar únicamente el contrato de vista necesario para esta herramienta.

## 9. Herramientas de dibujo

Reutilizar los builders existentes, pero separar operaciones:

### Editar existente

- mover vértice;
- insertar vértice sobre arista;
- eliminar vértice/arista cuando el bucle siga siendo válido;
- snap a endpoints y cierre;
- preview sin historial.

### Toolkit Modificar sobre provisional (plan Bloque 6B — 2026-08-10)

Misma sesión / mismo Workplane / misma SnapSession. Activar stubs de cinta Modificar
solo con sketch activo. Prioridad: mover → **split point** → **split line** → rotar →
fillet → copiar → desfase (opcional). Split point = vértice en arista; split line =
dividir arista(s) con traza en el plano (un bucle). No mutan `AxonDocument` hasta
Terminar. No es Edit Mode.

### Redibujar

- comando UI explícito que vacía el provisional, no el documento;
- Línea crea una polilínea ordenada;
- Rectángulo crea un bucle cerrado;
- Arcos pueden mantenerse tessellados en `v1`, conservando la misma aproximación al confirmar;
- el cierre produce exactamente un bucle.

No usar `appendProfileEdge()` sobre una semilla cerrada como semántica principal de Línea.

## 10. Persistencia

El contrato `.axon` debe cambiar de forma deliberada.

Ruta recomendada:

1. ADR de `formatVersion: 2`.
2. Lector v1: `height` se migra a `{ kind: "uniform", height }`.
3. Escritor v2: serializa `vertical`.
4. Lector v2: valida el perfil con los mismos predicados de dominio.
5. Recuperación: informa si un perfil inválido fue omitido; no lo convierte silenciosamente a caja.
6. Round-trip: vértices y clase de definición se conservan.

Mantener `formatVersion: 1` con un campo opcional permitiría que lectores antiguos ignoraran el perfil y destruyeran geometría al guardar. No hacerlo sin una política explícita alternativa.

## 11. Componentes afectados

| Área | Archivos/módulos principales |
|---|---|
| Modelo | `packages/model/src/types.ts`, `validate.ts`, `openingFit.ts`, `modelEnvelope.ts` |
| Comandos | `packages/commands/src/walls.ts`, exports y tests |
| Geometría | `wallBox.ts`, `openings.ts`, nuevo generador de perfil, outline/validate |
| Herramientas | `packages/tools/src/sketchProfile.ts`, builders y tests |
| Sesión | `sketchToolSlice.ts`, `commitSketchProfile.ts`, tipos de sesión |
| Viewer | picking, overlay/grips, `documentSceneSync.ts`, framing |
| UI | `Ribbon.tsx`, `PropertiesPanel.tsx`, mensajes de estado |
| Persistencia | shape, parse/recover/serialize, migraciones, tests |
| Documentación | `AGENTS.md`, editing paradigms, sketch outline, pending work, ADR, changelog |

## 12. Fases y gates

### Fase 0 — contrato y discrepancias

- actualizar la especificación de producto;
- decidir contrato local U/V;
- decidir versión `.axon`;
- decidir política inicial de joins y cambio de longitud;
- sustituir `SK-profile-one` por `SK-wall-profile-v1` en la cola.

**Gate:** revisión humana. Sin código productivo.

### Fase 1 — modelo y validación pura

- tipos discriminados;
- helpers locales;
- validación de polígono;
- compatibilidad de openings;
- tests puros.

**Gate:** invariantes y API aprobadas.

### Fase 2 — geometría derivada

- malla de perfil sin openings;
- malla con openings;
- BBox, volumen y normales;
- compatibilidad con muros uniformes.

**Gate:** oráculos geométricos y revisión visual controlada.

### Fase 3 — comando in-place

- `SetWallVerticalProfileCommand`;
- noop/rechazo/changed;
- Undo/Redo;
- conservación de IDs y openings.

**Gate:** pruebas de dominio e historial.

### Fase 4 — sesión, picking y dibujo

- resolver cara vertical;
- bloquear planta;
- perfil provisional ordenado;
- editar/redibujar;
- overlay con `axisU/axisV/normal`;
- commit mediante el nuevo comando.

**Gate:** flujo manual completo en elevación y 3D.

### Fase 5 — persistencia e integración

- migración `.axon`;
- round-trip;
- import/recover;
- actualización de Properties/Viewer/framing;
- E2E y documentación final.

**Gate:** matriz completa verde y autorización de cierre.

## 13. Criterio de finalización

El bloque sólo está terminado cuando un perfil inclinado o escalonado:

1. se dibuja como un único provisional;
2. se valida;
3. actualiza el mismo muro;
4. aparece correctamente en 3D;
5. conserva openings válidos;
6. sobrevive Undo/Redo;
7. sobrevive exportar/reabrir;
8. no puede iniciarse desde planta;
9. posee pruebas automáticas y checklist humana.

