# Cadena de instrucciones para Cursor

## Mandato general

Implementa únicamente el bloque autorizado `SK-wall-profile-v1`. No lo conviertas en Edit Mode, Push & Pull, Family Editor, losas, IFC, OpenCascade ni refactorización general del viewer.

Antes de modificar código, lee completamente:

- `AGENTS.md`;
- `.cursor/rules/*.mdc`;
- `docs/architecture/editing-paradigms.md`;
- `docs/architecture/sketch-result-outline.md`;
- `docs/architecture/document-model.md`;
- `docs/architecture/geometry-policy.md`;
- `docs/architecture/commands-and-history.md`;
- `docs/architecture/coordinate-system.md`;
- `docs/roadmap/workplanes-roadmap.md`;
- `docs/roadmap/pending-work.md`;
- ADR 0017 y gobernanza documental.

Si código, pruebas o documentos discrepan con este paquete, informa la discrepancia antes de cambiar arquitectura.

## Reglas no negociables

1. `AxonDocument` continúa siendo la única fuente de verdad.
2. React y Zustand sólo controlan el sketch provisional y la interacción.
3. Three.js sólo representa `MeshBuffer` derivado.
4. El perfil confirmado pertenece al muro, no al viewer.
5. La edición conserva el mismo `wallId`.
6. Puertas y ventanas válidas conservan sus IDs y `wallId`.
7. Un perfil que invalida un opening se rechaza; no se borra ni corrige silenciosamente.
8. Un gesto confirmado genera una entrada de historial.
9. Cancelar no muta documento ni historial.
10. Vista de planta no inicia edición vertical.
11. No usar `DeleteWallCommand + CreateWallCommand` para este caso.
12. No convertir aristas del contorno en muros.
13. No mantener simultáneamente `height` y un perfil personalizado como verdades divergentes.
14. No cambiar `.axon` sin versión/migración documentada.
15. No eliminar o debilitar pruebas para obtener verde.

## Formato obligatorio de cada entrega

Antes de pedir aprobación del siguiente bloque responde:

- Problema resuelto.
- Datos utilizados.
- Invariantes mantenidas.
- Componentes afectados.
- Archivos modificados.
- Tests añadidos/modificados.
- Resultados de test, typecheck y build.
- Qué no se implementó.
- Riesgos o decisiones pendientes.

## Bloque 0 — diagnóstico reproducible

No edites código productivo.

1. Reproduce un muro rectangular sin openings.
2. Selecciona una cara vertical.
3. Mueve un vértice superior para crear una pendiente.
4. Pulsa Terminar.
5. Demuestra que `invertVerticalFaceOutline()` reduce la forma a min/max.
6. Demuestra que `commitSketchProfile()` crea otro `Wall` sin perfil.
7. Identifica las pruebas que protegen el reemplazo actual.
8. Entrega mapa de archivos y diff propuesto.

**Parada obligatoria:** esperar aprobación.

## Bloque 1 — ADR y contrato documental

Sin implementar todavía el editor completo:

1. Crear ADR para perfil vertical de muro.
2. Definir coordenadas U/V locales.
3. Definir `WallVerticalDefinition` discriminada.
4. Definir política de longitud con perfil personalizado.
5. Definir política de altura en Properties.
6. Definir conservación/rechazo de openings.
7. Definir `formatVersion` y migración.
8. Definir entrada permitida desde elevación/3D.
9. Actualizar índice `AGENTS.md`, roadmap, sketch outline y changelog.

No marques como cerradas fases de código.

**Parada obligatoria:** esperar aprobación del contrato.

## Bloque 2 — dominio y pruebas puras

1. Introducir tipos de perfil sin imports UI/viewer.
2. Implementar helpers de transformación local/mundo.
3. Implementar rectángulo implícito para muros uniformes.
4. Implementar validación del bucle:
   - finitud;
   - longitud;
   - cierre;
   - continuidad;
   - área;
   - autointersección;
   - límites U/V.
5. Implementar validación de openings dentro del perfil.
6. Añadir unit tests antes de conectar la UI.

No editar todavía el viewer.

**Parada obligatoria:** mostrar API y tests.

## Bloque 3 — geometría

1. Crear generador de polígono extruido.
2. Mantener el camino de caja como optimización o hacerlo consumir el mismo contrato, sin dos verdades.
3. Incorporar openings rectangulares como huecos.
4. Verificar winding, normales y tapas.
5. Actualizar BBox, envelope, framing y métricas.
6. Definir fallback de joins con perfil personalizado.
7. Añadir pruebas geométricas independientes de Three.js.

Oráculos mínimos:

- BBox exacta dentro de tolerancia;
- volumen para perfil simple conocido;
- pendiente visible en vértices de malla;
- opening genera hueco real;
- no hay triángulos degenerados;
- orientación invertida del muro no invierte el sólido incorrectamente.

**Parada obligatoria:** evidencia numérica y captura visual.

## Bloque 4 — comando

1. Crear `SetWallVerticalProfileCommand`.
2. Validar en dominio dentro de `execute()`.
3. Distinguir changed/noop/rejected.
4. Conservar ID y referencias.
5. Snapshot profundo para Undo.
6. Validar openings antes de mutar.
7. Añadir pruebas de historial y rollback.

No uses una transacción Delete/Create como atajo.

**Parada obligatoria:** mostrar que Undo/Redo conserva IDs.

## Bloque 5 — vista, Workplane y picking

1. Bloquear entrada desde `ViewKind === "plan"`.
2. Formalizar el contexto de elevación/3D necesario.
3. Extender picking para devolver `WallHit` con cara, punto y normal.
4. Resolver el Workplane mediante `workplaneFromWallFace`.
5. Congelar ese Workplane durante la sesión.
6. Mantener cámara y Workplane desacoplados.
7. Orientar overlay, grips y offsets con `axisU`, `axisV` y `normal`.

No inferir el plano desde una proyección horizontal ni desde el primer storey.

**Parada obligatoria:** checklist manual en frontal, lateral e isométrica.

## Bloque 6 — editor provisional (+ toolkit Modificar)

**Plan ampliado 2026-08-10** (mismo hilo; no Edit Mode). Cortes **6A** (núcleo) y **6B**
(toolkit). Toda herramienta opera sobre el **provisional** (`sketchProfile`) y debe
integrar **Workplane activo** + **SnapSession** (picks en U/V del plano; snap extremos/orto/cierre).

### 6A — núcleo

1. Separar “Editar existente” y “Redibujar”.
2. Redibujar limpia sólo el provisional.
3. Línea produce una polilínea ordenada.
4. Rectángulo/arcos producen un solo perfil.
5. Añadir selección/eliminación/inserción mínima de vértices o aristas.
6. Validar únicamente al Terminar, con feedback provisional adicional permitido.
7. Error de validación conserva el sketch.
8. Cancelar restaura visualmente el muro intacto.
9. Terminar llama al nuevo comando in-place (`SetWallVerticalProfileCommand`).

### 6B — toolkit provisional (cinta Modificar, stubs → reales solo con sketch activo)

Prioridad: **Mover → Split point → Split line → Rotar → Fillet → Copiar → Desfase (opcional)**.

1. Mover selección (vértices / aristas / bucle) en el Workplane.
2. **Split point:** insertar vértice sobre una arista en el pick (snap extremos / medio / orto en el plano).
3. **Split line:** dividir arista(s) del perfil con una traza en el Workplane (más segmentos, **un** bucle; no N hosts).
4. Rotar alrededor de un pivote en el plano (ángulo + snap orto cuando aplique).
5. Fillet de esquina del bucle (radio; resultado sigue siendo polilínea/vértices en el plano).
6. Copiar selección o bucle en el plano (sigue un solo perfil de host al Terminar).
7. Desfase opcional del contorno en el plano.
8. Reutilizar builders/`@axonbim/tools` + SnapSession; **no** mutar `AxonDocument` hasta Terminar.
9. No inventar segundo SoT ni desacoplar tools del Workplane congelado (Bloque 5).

Retirar el test que espera cuatro muros sólo después de reemplazarlo por el oráculo correcto.

**Parada obligatoria:** flujo humano completo (perfil + Mover / Split point·line / Fillet con snap en cara).

## Bloque 7 — persistencia e integración

1. Implementar migración de v1 uniforme a v2.
2. Serializar y leer perfiles.
3. Validar importación estricta.
4. Definir recuperación sin pérdida silenciosa.
5. Probar exportar/reabrir.
6. Ajustar Properties y helpers que leen `wall.height`.
7. Ejecutar tests, typecheck, build, checks documentales y E2E autorizado.
8. Actualizar toda la documentación e índice.

**Parada obligatoria:** entregar matriz final; no abrir otra feature.

## Rechazos que Cursor debe emitir

Detente y solicita decisión si aparece cualquiera de estos puntos:

- política no definida para cambiar la longitud de un muro perfilado;
- necesidad de múltiples loops dibujados por el usuario;
- perfil que requiere islas desconectadas;
- joins complejos entre dos perfiles personalizados;
- dependencia geométrica nueva sin revisión de licencia;
- propuesta de mantener v1 con riesgo de pérdida silenciosa;
- expansión hacia Edit Mode, losas o familias.

## Definición de “no terminado”

La función no está terminada si ocurre al menos uno:

- sólo cambia `height`;
- el perfil irregular reaparece rectangular;
- cambia `wallId`;
- borra openings;
- funciona sólo en el overlay y no después de reabrir;
- permite planta;
- el test prueba únicamente número de muros;
- la malla se convierte en SoT;
- Undo/Redo no restaura exactamente el perfil.

