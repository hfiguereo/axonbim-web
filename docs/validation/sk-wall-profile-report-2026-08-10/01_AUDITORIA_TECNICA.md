# Auditoría técnica — edición de perfil vertical de muro

## 1. Alcance

Se auditó el recorrido completo de la función desde la interacción en el `Viewport` hasta:

- estado provisional de Sketch Mode;
- Workplane activo;
- herramientas de dibujo;
- validación al confirmar;
- comandos e historial;
- `AxonDocument`;
- generación de geometría;
- sincronización con Three.js;
- persistencia `.axon`;
- pruebas existentes y documentación vigente.

No se modificó el código del proyecto.

## 2. Hallazgo principal

**Severidad: crítica para la función solicitada.**

La edición actual representa un contorno en sesión, pero no posee una entidad de dominio capaz de conservarlo. El resultado confirmado siempre vuelve a un muro rectangular de altura uniforme o, en otros casos, descompone el contorno en varios muros.

El comportamiento observado por el usuario —mover dos aristas para reducir la altura— coincide con la implementación.

## 3. Evidencias de código

### 3.1 El modelo no puede guardar un perfil

Archivo: `packages/model/src/types.ts`

El contrato vigente de `Wall` contiene:

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

No existe ningún campo para:

- contorno vertical;
- bucle exterior;
- vértices locales del perfil;
- segmentos o arcos del perfil;
- huecos geométricos del perfil.

Por tanto, aunque la UI permita dibujar una forma irregular, el documento no tiene dónde conservarla.

### 3.2 La geometría sólo genera una caja

Archivo: `packages/geometry/src/wallBox.ts`

`wallBoxMesh()` calcula:

- dirección del eje `p1 → p2`;
- normal horizontal;
- cuatro esquinas de la huella;
- `z0` como base;
- `z1 = z0 + wall.height`;
- seis caras rectangulares.

El resultado es siempre un prisma rectangular. Three.js únicamente recibe el `MeshBuffer` derivado; no decide la forma paramétrica del muro.

### 3.3 El contorno vertical se reduce a una caja envolvente

Archivo: `packages/geometry/src/wallResultOutline.ts`

`invertVerticalFaceOutline()` transforma todos los puntos a coordenadas UV y sólo conserva:

```ts
uMin, uMax, vMin, vMax
```

Después retorna una línea inferior y:

```ts
height = vMax - vMin
```

Consecuencias:

- una cubierta inclinada se vuelve horizontal;
- un escalón desaparece;
- cinco, seis o más vértices terminan reducidos a cuatro límites;
- un borde inferior irregular se pierde;
- la posición vertical inferior propuesta se vuelve a proyectar al nivel del storey durante el commit.

### 3.4 El commit descarta el contorno

Archivo: `apps/web/src/session/commitSketchProfile.ts`

Para una cara o silueta vertical:

1. llama `invertVerticalFaceOutline()`;
2. obtiene una línea base y una altura;
3. crea un nuevo objeto `Wall` con `p1`, `p2`, `height` y `thickness`;
4. elimina el host anterior;
5. crea el nuevo muro.

El contorno dibujado no llega a `AxonDocument`.

### 3.5 Se pierde la identidad del elemento

El adaptador usa una transacción compuesta con:

```ts
DeleteWallCommand(sourceId)
CreateWallCommand(newWall)
```

Esto genera un `wallId` nuevo. Es incompatible con una edición de perfil normal porque:

- rompe referencias estables;
- obliga a borrar o bloquear elementos hospedados;
- dificulta relaciones futuras con cotas, restricciones o documentación;
- hace que Undo/Redo represente un reemplazo de entidad, no la edición de la misma entidad.

El repositorio ya posee `SetWallEndpointsCommand`, que demuestra la dirección correcta para ediciones in-place, pero no existe `SetWallVerticalProfileCommand`.

### 3.6 Las puertas y ventanas bloquean la función

`validateSketchProfileForHost()` rechaza cualquier reemplazo cuando el muro posee openings. Es una defensa coherente con el algoritmo destructivo actual, pero no es un resultado de producto aceptable.

Una edición correcta debe conservar los elementos hospedados y comprobar si sus rectángulos continúan dentro del nuevo perfil.

### 3.7 La herramienta Línea no redibuja limpiamente el perfil

Archivos:

- `apps/web/src/session/sketchToolSlice.ts`
- `packages/tools/src/sketchProfile.ts`
- `apps/web/src/components/Ribbon.tsx`

Comportamiento actual:

- la semilla es el rectángulo de la cara del muro;
- Línea aparece visualmente como **Vértices**;
- si se hace clic lejos de un grip, `appendProfileEdge()` agrega segmentos a la semilla existente;
- `closed` puede permanecer verdadero aunque se añadan aristas desconectadas;
- no existe una operación clara de “Redibujar perfil con Línea”;
- no existen selección/eliminación de aristas ni inserción explícita de vértices;
- `profileToPoints()` supone que las aristas ya están ordenadas y conectadas.

Esto reutiliza botones de dibujo, pero no constituye todavía un editor topológico de un único contorno.

### 3.8 La validación es insuficiente

Archivo: `packages/geometry/src/sketchProfileValidate.ts`

La validación actual cubre principalmente:

- perfil no vacío;
- longitud mínima de algún segmento;
- existencia de hosts;
- bloqueo por openings;
- algunos intentos de inversión a muro.

No garantiza de forma completa:

- continuidad entre aristas;
- cierre geométrico real;
- un único bucle;
- ausencia de autointersecciones;
- área distinta de cero;
- ausencia de aristas duplicadas;
- winding coherente;
- que todos los vértices estén dentro del dominio horizontal permitido;
- que el contorno contenga los huecos hospedados.

### 3.9 La entrada desde vistas no cumple el contrato requerido

Archivo: `apps/web/src/session/sessionTypes.ts`

El modelo de vistas sólo contiene:

```ts
type ViewKind = "plan" | "perspective" | "camera";
```

Las orientaciones frontal, posterior, izquierda y derecha son presets temporales de la cámara 3D, no vistas de elevación formales.

Además:

- el doble clic permite entrar al Sketch desde cualquier vista;
- si el Workplane activo es `storey`, `enterSketchOnElement()` carga la huella horizontal;
- la selección del muro devuelve principalmente el ID, no un contrato completo `wallId + face + hitPoint + normal`;
- el usuario debe haber seleccionado manualmente un Workplane de superficie para obtener la cara vertical correcta.

Esto explica por qué la existencia de Workplanes no basta: la entrada de la herramienta no los resuelve automáticamente según la intención de editar el perfil vertical.

### 3.10 Overlay y grips no están orientados completamente al Workplane

En la representación provisional se aplican offsets y cruces usando principalmente X/Y/Z globales. En una cara vertical:

- el offset `+Z` desplaza el perfil hacia arriba en lugar de separarlo de la cara por su normal;
- los grips no se construyen sistemáticamente con `axisU/axisV`;
- la posición dibujada y la posición usada para hit-test pueden quedar muy cerca del límite de tolerancia.

No es la causa principal de la pérdida del perfil, pero debe corregirse para que el editor funcione con cualquier orientación del muro.

## 4. Discrepancia con documentación y pruebas

### 4.1 Documentación

`docs/architecture/sketch-result-outline.md` reconoce como deuda que una silueta libre puede convertirse en N muros y denomina `SK-profile-one` al corte siguiente.

Sin embargo, producir “un único muro” no basta. Si ese muro continúa teniendo solamente `height`, el contorno irregular seguirá desapareciendo. El siguiente corte debe redefinirse como persistencia real de perfil vertical.

También existe una diferencia con la decisión del dueño del producto:

- comportamiento deseado: edición vertical únicamente desde elevación o 3D;
- código/documentación actual: entrada desde cualquier vista y Workplane activo potencialmente horizontal.

### 4.2 Pruebas

Archivo: `apps/web/src/session/sketchProfileSession.test.ts`

Una prueba exige explícitamente:

```text
free non-rect footprint Terminar creates walls from edges (replace)
```

Y espera cuatro muros. Esa prueba protege el comportamiento que ahora debe retirarse.

La prueba de Workplane vertical sólo verifica que:

- se carga un rectángulo de cara;
- los vértices permanecen sobre el plano.

No prueba que un perfil irregular sobreviva después de Terminar, Undo/Redo o guardar/reabrir.

## 5. Verificación ejecutada

- TypeScript de la aplicación: correcto.
- TypeScript E2E: correcto.
- Build de producción: correcto, con advertencia de bundle grande ya conocida.
- Se ejecutaron 32 aserciones relacionadas con Sketch Profile, Workplanes y geometría; todas pasaron.
- El proceso Vitest no cerró automáticamente después de imprimir las aserciones en el entorno extraído y tuvo que interrumpirse. Debe comprobarse en el repositorio Git real.
- Los scripts que dependen de `git ls-files` no pueden ejecutarse sobre el ZIP extraído porque no contiene `.git`.

Interpretación: el código compila y satisface sus pruebas actuales, pero esas pruebas codifican un contrato incompleto y, en un caso, contrario al nuevo requisito.

## 6. Impacto arquitectónico

| Capa | Situación actual | Cambio requerido |
|---|---|---|
| Modelo | Eje + altura uniforme | Definición vertical uniforme o perfil |
| Commands | Delete + Create | Set profile in-place |
| Geometry | Prisma rectangular | Polígono UV extruido por espesor |
| Openings | Partición de cajas | Huecos rectangulares dentro del perfil |
| Tools | Aristas provisionales débiles | Un bucle ordenado editable |
| Session | Workplane preexistente | Resolver cara automáticamente |
| Viewer | ID de muro | Hit con cara/punto/normal |
| UI | Entrada desde cualquier vista | Sólo elevación/3D |
| Persistence | `.axon` v1 sin perfil | Versión/migración deliberada |
| Tests | Protegen reemplazo destructivo | Probar conservación exacta del perfil |

## 7. Veredicto

No debe corregirse como un parche visual ni como una modificación de `invertVerticalFaceOutline()`. El problema es de representación de dominio y recorre todas las capas.

La solución correcta es un perfil vertical persistente perteneciente al muro paramétrico, editado provisionalmente sobre la cara vertical, validado al confirmar y aplicado mediante un comando in-place.

