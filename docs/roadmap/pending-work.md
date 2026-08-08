# Pendientes — hilo único de trabajo

**Fuente de verdad** para lo que queda por hacer. Si otro documento contradice este,
**prevalece este** hasta que se actualice explícitamente.

Última revisión: **2026-08-08** (checklist humana Fases 1–3 OK · Fase 4 autorizada).

## Cola activa

| Fase | Estado | Gate |
|------|--------|------|
| **0** Base operativa | **cerrada** | Repo público + branch protection + `check:history` |
| **1** Session slices | **cerrada** | Checklist humana A/B OK |
| **2** Viewer módulos | **cerrada** | Checklist humana D/E OK (D4 con observaciones) |
| **3** Deuda residual | **cerrada** | Base limpia declarada; checklist C OK con observaciones |
| **4** Desarrollo parked | **autorizada** | Elegir primer ítem + gate/ADR |

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

Elegir primer feature Fase 4 (sugerido: C3 crop en más vistas).
