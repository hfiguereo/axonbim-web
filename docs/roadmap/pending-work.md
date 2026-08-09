# Pendientes — hilo único de trabajo

**Fuente de verdad** para lo que queda por hacer. Si otro documento contradice este,
**prevalece este** hasta que se actualice explícitamente.

Última revisión: **2026-08-08 (tarde)** — auditoría externa recibida; **F9-E propuesta y
Fase 4 en espera**.

## Cola activa

| Fase | Estado | Gate |
|------|--------|------|
| **0** Base operativa | **cerrada** | Repo público + branch protection + `check:history` |
| **1** Session slices | **cerrada** | Checklist humana A/B OK |
| **2** Viewer módulos | **cerrada** | Checklist humana D/E OK (D4 con observaciones) |
| **3** Deuda residual | **cerrada** | Base limpia declarada; checklist C OK con observaciones |
| **F9-E** Integridad del documento | **propuesta · espera dueño** | ADR 0017 + [`domain-invariants-plan.md`](domain-invariants-plan.md) |
| **4** Desarrollo parked | **autorizada, en espera** | Recomendado: después de F9-E1/E2 |

### Por qué Fase 4 queda en espera (2026-08-08)

La Fase 4 sigue **autorizada** por el dueño; lo que cambia es la recomendación técnica. Una
[auditoría externa](../validation/external-audit-2026-08-08.md) encontró seis hallazgos
**P0/P1 de integridad de datos** y recomienda no abrir expansión funcional antes de
cerrarlos. Verificados uno a uno en el código.

El más urgente **no es hipotético**: colocar una puerta solo comprueba solape contra otras
puertas (`sketchToolSlice.ts:253`), así que **poner una ventana y luego una puerta encima
solapa hoy**, y una puerta puede invadir una ventana al cambiar de familia. La geometría
procesa huecos con un cursor secuencial sin unión de intervalos, así que el resultado es
indefinido.

El segundo destruye archivos del usuario: abrir un `.axon` con catálogo de familias propio,
dibujar y exportar produce un archivo que **el propio parser rechaza al reabrirlo**.

La decisión es del dueño. La recomendación es F9-E1 + F9-E2 antes de cualquier feature.

### Checklist humana (2026-08-08)

| Bloque | Resultado | Notas |
|--------|-----------|-------|
| A Historial/SoT | **ready** | — |
| B Selección | **ready** | — |
| C Crop ADR 0016 | **ready** | Ver bug **BUG-C** abajo |
| D Picking | **aprobado** | Ver bug **BUG-D4** abajo |
| E Cámara/navegación | **ready** | — |

Dueño: «Checklist Fases 1–3 OK — autorizo Fase 4».

### Bugs de checklist (antes o junto a Fase 4)

| ID | Severidad | Descripción | Hipótesis técnica |
|----|-----------|-------------|-------------------|
| **BUG-C** | producto ADR 0016 | Solo **vista cámara**: el crop encuadra (marco) pero **no oculta** fuera del recuadro. **Planta OK.** | **corregido 2026-08-08** — máscara CSS del marco era alpha 0.45; ahora opaca `#1c2228` |
| **BUG-D4** | UX picking | Puntos azul/verde crecen con zoom | **aceptado por ahora** (2026-08-08) — hay tope `MAX_FLIP_CONTROL_RADIUS`; dueño deja así; reabrir si molesta |

---

## Prioridad global (mayor → menor)

### 0. F9-E — estabilización de integridad (recomendada antes de features)

Plan completo con gates: [`domain-invariants-plan.md`](domain-invariants-plan.md).
Contrato: [ADR 0017](../decisions/0017-domain-invariants-in-commands.md).

| Fase | Qué cierra | Hallazgo | Decisión de producto pendiente |
|------|-----------|----------|-------------------------------|
| **F9-E1** | Contrato de validez: predicados en `model` + resultado estructurado de `Command` | AX-P0-01, AX-P2-08/09 | — |
| **F9-E2** | Huecos hospedados: una sola función de intervalos | AX-P1-04 (**bug presente**) | — |
| **F9-E3** | Catálogo de familias | AX-P0-02 | **sí**: catálogo del documento (A) vs built-ins fijos v1 (B) |
| **F9-E4** | Cámaras y sesión: una sola verdad + reset de proyecto | AX-P1-05/06, AX-P2-07 | **sí**: derivar vistas (A) vs reconciliar (B) |
| **F9-E5** | Frontera `.axon` | AX-P1-03, A4 reabierto | **sí**: rechazo duro vs apertura con informe |
| **F9-E6** | Docs y guardias (`check:links`, matriz post-MVP) | DOC-01…10 | — |

Ninguna fase autorizada. Las tres decisiones de producto deben resolverse **antes** de su
fase, no durante.

### 1. Fase 4 — features parked (elige uno)

Cada ítem = autorización explícita + ADR/gate si aplica. **No empezar** sin frase en chat.

| Prioridad | Tema | Doc |
|-----------|------|-----|
| 1 | Crop editable en más vistas (**C3**) | ADR 0016 |
| 2 | Workplanes / paradigmas de edición | [`workplanes-roadmap.md`](workplanes-roadmap.md) |
| 3 | OpenCascade / kernel CAD | ADR 0013 |
| 4 | IFC operativo | ADR 0003 |
| 5 | IndexedDB / OPFS / PWA | technical-audit §No introducir |
| 6 | Colaboración multiusuario | — |
| 7 | Nuevos tipos de elemento, familias, más Playwright, desktop no portado | gate + ADR cada uno |

---

### 2. Proceso (Hilo A)

| ID | Pendiente | Estado |
|----|-----------|--------|
| **A1** | Repo público + branch protection | **cerrado** 2026-08-08 |
| **A2** | Mantener docs al cerrar gates | Práctica continua |
| **A3** | Límite conocido de CI | Contract tests + e2e |

---

### 3. Deuda técnica (Hilo B)

| ID | Deuda | Estado |
|----|-------|--------|
| **B5 session** | monolito sessionStore | **cerrado** |
| **B5 viewer** | monolito createViewport | **cerrado** |
| **B6** | invariantes del documento dependen de la UI | **abierto** — ADR 0017 · F9-E |

#### B6 — arquitectura declarada vs ejecutada (hallazgo 2026-08-08)

El núcleo está separado: **ninguna** mutación de `AxonDocument` ocurre fuera de
`HistoryStack`, y la auditoría externa lo confirma de forma independiente. Pero las reglas
geométricas viven en `sketchToolSlice` / `selectionSlice`, no en los comandos que escriben.
`CreateDoorCommand` solo valida ID duplicado y `wallId` existente
(`packages/commands/src/doors.ts:22`).

Dicho de la forma más corta: **el dominio declara reglas más estrictas de las que hace
cumplir**. El detalle, con los cinco agujeros y su evidencia, está en
[ADR 0017](../decisions/0017-domain-invariants-in-commands.md); las fases en
[`domain-invariants-plan.md`](domain-invariants-plan.md).

Corrección de la primera versión de este hallazgo: se propuso mantener `execute: boolean`.
Era insuficiente. `documentMutation.ts:35-38` convierte todo `false` en «Sin cambios», así
que con un booleano es imposible cumplir `commands-and-history.md:16`, que ya exigía error
explícito a la UI. Va resultado estructurado (F9-E1).

---

### 4. Decisiones de producto (Hilo C)

| ID | Tema | Estado |
|----|------|--------|
| **C1** | Umbrales clic | **cerrado (MVP)** |
| **C2** | Bundle ~834 kB | **cerrado (MVP)** |
| **C3** | Crop en más vistas | **Fase 4 · prioridad 1** |

---

## Qué está cerrado (referencia rápida)

| Área | Cierre | Dónde |
|------|--------|-------|
| F5-S, F8, ADR 0014–0016 | 2026-08-07/08 | gates |
| Auditoría P1–P5 | 2026-08-08 | technical-audit |
| Desacople Fases 0–3 + checklist humana | 2026-08-08 | este doc, gates |
| A1 protección remota | 2026-08-08 | github.md |

---

## Próximo paso recomendado

**F9-E1 + F9-E2 antes de cualquier feature.** E2 cierra un bug de producto presente (solape
ventana→puerta) y E1 es su requisito, porque sin resultado estructurado de `Command` el
rechazo no se puede explicar al usuario.

Después, elegir entre F9-E3 (catálogos, protege archivos del usuario) y F9-E4 (cámaras,
protege undo/redo). Las dos empiezan con una decisión de producto que el dueño debe tomar.

Si se prefiere producto visible primero, la alternativa sigue siendo C3 (crop en más
vistas), aceptando que cada feature nueva reimplementa reglas en la UI y que el solape
ventana→puerta sigue abierto.
