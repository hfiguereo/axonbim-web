# Pendientes — hilo único de trabajo

**Fuente de verdad** para lo que queda por hacer. Si otro documento contradice este,
**prevalece este** hasta que se actualice explícitamente.

Última revisión: **2026-08-08** (auditoría del control cerrada; cortes pausados).

## Cómo leer esto

Hay **tres hilos** que no deben mezclarse. Cada ítem lleva su hilo y su prioridad
global (1 = más urgente).

| Hilo | Qué es | Estado |
|------|--------|--------|
| **A — Control** | Reglas que se comprueban solas (CI, guardias, lint) | **cerrado** (P1–P5 hechos) |
| **B — Refactor** | Microcortes `sessionStore` / `createViewport` | **pausado** (espera decisión de objetivo) |
| **C — Producto** | Comportamiento visible, nuevas capacidades, UX | **cola baja** — no tocar sin autorización |

**Auditoría del control:** serie D en [`technical-audit-2026-08.md`](../validation/technical-audit-2026-08.md).
**Refactor:** plan y medición en [`refactor-session-viewer.md`](refactor-session-viewer.md).

---

## Prioridad global (mayor → menor)

Solo aparecen ítems **abiertos** o **bloqueados en ti**. Lo ya hecho (P1–P5, cortes 1–7c,
F5-S, F8, ADR 0014–0016) está en [`gates.md`](gates.md) y en el CHANGELOG.

### 1. Decisión bloqueante — objetivo del refactor (Hilo B)

| ID | Qué decidir | Por qué importa | Acción cuando decidas |
|----|-------------|-----------------|------------------------|
| **R1** | ¿Seguir cortes **triviales** (más testabilidad, ~7 % menos monolito) o **diseñar descomposición real** (mover estado/efectos)? | Diez cortes ya demostraron que la vía actual **no rompe el monolito** (1696→1541 y 1380→1316). Seguir sin elegir acumula módulos pero no resuelve B5. | Autorizar **7d** (objetivo 1) **o** pedir un **plan de diseño** antes de tocar código (objetivo 2). Ver medición en refactor doc. |

**Estado:** pausado · **espera tu OK** · no es trabajo de auditoría.

---

### 2. Proceso y riesgo — sin respaldo mecánico completo (Hilo A)

| ID | Pendiente | Por qué importa | Bloqueo |
|----|-----------|-----------------|---------|
| **A1** | Protección de rama en GitHub (`main` no se puede forzar desde fuera) | La regla «solo `main`» depende de la obediencia del agente. Hoy solo existe `main` en el remoto, pero no hay candado de plataforma. | Repo privado en plan gratuito → API responde **403**. Opciones: GitHub Pro, repo público, o aceptar el riesgo con disciplina manual. |
| **A2** | Mantener docs al cerrar gates | C1 demostró que la auditoría y el plan de refactor **mintieron** sobre el estado real. | **Hábito:** al cerrar un gate, reverificar hallazgos contra el código y actualizar **este documento**. Los guardias `check:docs` y `check:shortcuts` ayudan; no sustituyen la revisión humana. |
| **A3** | Límite conocido de CI | Ningún guardia detecta un test que pasa sin comprobar lo que dice. | Al autorizar trabajo sensible, pedir **verificación en negativo** (romper a propósito y comprobar que falla). Documentado en technical-audit. |

**Estado:** A1 abierto por plataforma · A2/A3 son práctica continua, no tickets.

---

### 3. Deuda técnica medida — monolitos (Hilo B, ligado a R1)

| ID | Deuda | Evidencia | Notas |
|----|-------|-----------|-------|
| **B5** | `sessionStore.ts` (~1541 líneas) y `createViewport.ts` (~1316 líneas) | Hallazgo B5; medición 2026-08-08 | **No cerrar** con más cortes de funciones puras sin haber resuelto **R1**. Objetivo 2 requiere diseño, no un «corte 8». |

**Estado:** abierto · subordinado a **R1**.

---

### 4. Decisiones de producto pendientes (Hilo C — prioridad media-baja)

Requieren tu criterio de uso, no solo ingeniería.

| ID | Tema | Contexto | Estado |
|----|------|----------|--------|
| **C1** | Unificar umbrales de proximidad de clic | B2: entidad 14 px, grip crop 14, marco 16, flip 16 — nombrados pero sin criterio único | **Abierto** · marco ya subido a 16 px por tu pedido; el resto sin unificar |
| **C2** | Bundle de producción ~834 kB | Aviso Vite (>500 kB) al añadir `build` en CI | **Abierto** · ¿optimizar ahora o aceptar en MVP? |
| **C3** | Marco de crop editable en todas las vistas | ADR 0016: marco seleccionable en planta; cámaras con lógica distinta | **Parcial** · funciona en planta; ampliar requiere gate/ADR |

**Estado:** ninguno autorizado para implementar hoy.

---

### 5. Refactor en cola — pausado (Hilo B)

No empezar hasta resolver **R1**.

| ID | Ítem | Tipo | Modelo sugerido |
|----|------|------|-----------------|
| **7d** | Extraer materiales/escena del viewer (`clipMats`, grupos, dispose) | trivial×≤3 | Composer |
| **7e+** | Sin planificar | — | Depende de R1 |

Detalle de cortes hechos (1–7c): [`refactor-session-viewer.md`](refactor-session-viewer.md).

---

### 6. Parked por gate — no tocar sin autorización nueva (Hilo C)

Explícitamente **fuera** del MVP y de F5-S. Autorización = gate + ADR, no «continúa».

| Tema | Doc | Motivo del parking |
|------|-----|-------------------|
| Workplanes / paradigmas de edición | [`workplanes-roadmap.md`](workplanes-roadmap.md), [`editing-paradigms.md`](../architecture/editing-paradigms.md) | Gate no abierto |
| OpenCascade / kernel CAD | ADR 0013 | Parked; geometría MVP sin OCCT |
| IFC operativo | ADR 0003 | Adaptador futuro, no MVP |
| IndexedDB / OPFS / PWA | technical-audit §No introducir | Fuera de fase |
| Colaboración multiusuario | — | Fuera de fase |
| Migrar todo a UUID | — | Fuera de fase |

---

### 7. Continuación de desarrollo y nuevas features (Hilo C — **menor prioridad**)

**No empezar** mientras **R1** (refactor) o ítems de producto **C1–C3** sigan sin decidir,
salvo que autorices explícitamente saltar la cola.

Ejemplos de lo que **no** está en cola activa:

- Nuevos tipos de elemento (losas, columnas, techos…)
- Editor general de familias
- Import/export más allá de `.axon`
- Expansión Playwright más allá de F8 o1+o2
- Mejoras cosméticas de shell no pedidas
- Cualquier feature del desktop no portada con ficha + ADR

Cuando quieras abrir una feature nueva: **gate + ADR + entrada nueva en este documento**
con prioridad explícita (no sustituye silenciosamente lo de arriba).

---

## Qué está cerrado (referencia rápida)

Para no reabrir hilos terminados:

| Área | Cierre | Dónde |
|------|--------|-------|
| F5-S estabilización | 2026-08-07 | `f5-stabilization.md`, gates |
| F8 Playwright o1 + CI + o2 | 2026-08-08 | `playwright-f8.md`, gates |
| ADR 0014–0016 (gizmo, cámaras, crop) | 2026-08-08 | ADR, gates |
| Auditoría control P1–P5 | 2026-08-08 | `technical-audit-2026-08.md` serie D |
| CI siete pasos | 2026-08-08 | `github.md` |
| Cortes refactor 1–7c | 2026-08-08 | `refactor-session-viewer.md` |

---

## CI vigente (recordatorio)

Cada push a `main` ejecuta, en orden:

1. `pnpm check:shortcuts`
2. `pnpm check:docs`
3. `pnpm check:layers`
4. `pnpm typecheck` (incluye `e2e/`)
5. `pnpm lint`
6. `pnpm test`
7. `pnpm build`

Más workflow aparte: `pnpm test:e2e` (Playwright).

---

## Próximo paso recomendado (una sola cosa)

**Resolver R1:** decir si al reanudar el refactor quieres **7d** (más testabilidad) o un
**diseño de descomposición** antes de otro corte. Todo lo demás espera detrás de eso o
pertenece a la cola baja de producto.

Cuando tomes una decisión, actualiza este documento (o pide al agente que lo haga en la
misma tarea) para no perder trazabilidad.
