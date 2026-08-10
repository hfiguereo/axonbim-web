# Pendientes — hilo único de trabajo

**Fuente de verdad** para lo que queda por hacer. Si otro documento contradice este,
**prevalece este** hasta que se actualice explícitamente.

Última revisión: **2026-08-10** — hilo LR; SK-* base cerradas; **SK-profile-one** siguiente (auth).

Detalle de bloques LR: [`legacy-reuse-roadmap.md`](legacy-reuse-roadmap.md) ·
resumen [`../migration/plan-integracion-selectiva-resumen.md`](../migration/plan-integracion-selectiva-resumen.md).

---

## Hilo activo (solo adelante)

Secuencia obligatoria. **No saltar** bloques ni abrir IFC/OCCT/Edit Mode antes de su
prerrequisito. Cada bloque = frase explícita en chat + gate.

```
LR0–LR3 + WP + SK-* base → **SK-profile-one** (auth) → losas/terreno/barridos u Edit Mode (auth)
                                                      ↘ LR3-D → LR4… (parked)
```

| Orden | Bloque | Estado | Gate de cierre |
|-------|--------|--------|----------------|
| — | **LR0** Formalización legado | **cerrada** 2026-08-09 | Docs indexados; inventario clasificado |
| — | **LR1** SnapSession + histéresis | **cerrada** 2026-08-09 | Enter 12° / hold 22°; session fuera de documento |
| — | **LR1-B** Restart Chain | **cerrada** 2026-08-09 | `restartChainAt`; cinta Reiniciar; sin historial |
| — | **LR2** Command Transactions | **cerrada** 2026-08-09 | `CompositeCommand` atómico + tests |
| — | **LR3-A…D** Spatial Reference Context | **cerrada** 2026-08-09 | Active Storey · Datum · Envelope · Projection Basis |
| — | **WP-v1** Workplane compartido | **cerrada** 2026-08-09 | [`workplanes-roadmap.md`](workplanes-roadmap.md) |
| — | **WP-v2** Planos tangibles | **cerrada** 2026-08-09 | Nivel · superficie · línea; overlay; sesión |
| — | **SK-v1** Sketch Mode (rectángulo) | **cerrada** 2026-08-09 | [`editing-paradigms.md`](../architecture/editing-paradigms.md) |
| — | **SK-sel** Sketch sobre selección | **cerrada** 2026-08-09 | Entrada UX; carga perfil (SK-profile) |
| — | **SK-draw** Dibujar completo | **cerrada** 2026-08-09 | Builders globales; commit muro = adaptador crear |
| — | **SK-profile** + **SK-replace v0** | **cerrada** 2026-08-09 | Provisional libre; replace Delete+Create; **deuda: N muros por arista de silueta** |
| **1** | **SK-profile-one** | **siguiente** (auth) | Un único perfil materializado; sin solape silueta→N muros. Contrato: [`sketch-result-outline.md`](../architecture/sketch-result-outline.md) |
| **2** | **Sketch → losas / terreno / barridos** u **Edit Mode** | auth | Tras SK-profile-one (o en paralelo solo con auth explícita) |

### Parked (no son el hilo actual)

Solo con auth **y** prerrequisitos. No reordenan la cola de arriba.

| Tema | Prerreq. | Doc |
|------|----------|-----|
| **LR1-C** Snaps geométricos (midpoint, perpendicular, …) | tras LR1; auth | `legacy-reuse-roadmap.md` §LR1-C |
| LR4 Technical Views | LR3-D + auth doc 2D | `legacy-reuse-roadmap.md` |
| LR5 Render invalidation | evidencia de coste | idem |
| LR6 IFC Recognition Policy | auth IFC | ADR 0003 |
| LR7 Grid adaptativo | LR3 | UX only |
| OpenCascade | auth | ADR 0013 |
| IFC operativo | LR6 + auth | ADR 0003 |
| PWA / OPFS / IndexedDB | — | technical-audit §No introducir |
| Colaboración / más Playwright / nuevos tipos | gate + ADR | — |

### Informe mínimo por bloque LR (antes de programar)

Problema · comportamiento Desktop recuperado · datos · invariantes · componentes Web ·
qué **no** se reutiliza · tests. Tras: archivos · tests · Undo/Redo si aplica · docs.

### Próximo paso

Autorizar **SK-profile-one** (un único perfil al Terminar; sin silueta→N muros).
Frase p. ej. «autorizo SK-profile-one». Detalle:
[`../architecture/sketch-result-outline.md`](../architecture/sketch-result-outline.md).

Losas / terreno / barridos / Edit Mode: auth aparte **después** (o con frase explícita).
Family Editor / Push&Pull / LR1-C / LR4+ parked.

---

## Cola histórica (cerrada — no reabrir salvo regresión)

| Fase | Estado | Gate |
|------|--------|------|
| **0–3** Desacople session/viewer + deuda | **cerrada** | Checklist A–E 2026-08-08 |
| **F9-E1…E6** Integridad | **cerrada** | ADR 0017; checklists humanas OK |
| **F9-E** (programa) | **cerrada** | 2026-08-09 |
| **4 · C3** Crop marco cámara | **cerrada** | Checklist OK 2026-08-09 |
| **LR0** Formalización legado | **cerrada** | Indexado 2026-08-09 |
| **LR1** SnapSession | **cerrada** | Histéresis orto; tests tools + session |
| **LR1-B** Restart Chain | **cerrada** | `restartChainAt` + cinta Reiniciar |
| **LR2** CompositeCommand | **cerrada** | Transacción atómica en history |
| **LR3-A…D** Spatial Reference | **cerrada** | `getActiveStorey` · datums · envelope · projection basis |
| **WP-v1** Workplane | **cerrada** | `resolveSpatialReference`; tools sin acoplar a cámara |
| **WP-v2** Planos tangibles | **cerrada** | Nivel · superficie · línea; `activeWorkplane` sesión |
| **SK-v1** Sketch Mode | **cerrada** | Rectángulo → 4 muros / CompositeCommand; arcos stub |
| **SK-sel** Sketch selección | **cerrada** | Doble clic / Editar perfil; `sketchTarget` |
| **SK-draw** Dibujar | **cerrada** | Arcos tessellados; pickLines/pickFace; preview polilínea |
| **SK-profile** + SK-replace v0 | **cerrada** | Provisional libre; replace; **deuda** silueta→N muros |
| **SK-profile-one** | **siguiente** | Un perfil materializado; ver `sketch-result-outline.md` |

### Checklists humanas cerradas (referencia)

| Bloque | Resultado |
|--------|-----------|
| Fases 1–3 (A–E) | OK 2026-08-08 (D4 obs. aceptada; BUG-C corregido) |
| F9-E2…E6 | OK 2026-08-09 |
| C3 crop/marco | OK 2026-08-09 — marco CSS + nav lock; crop real en planta |
| LR0 docs | OK 2026-08-09 — PDF + resumen + roadmap + inventario |
| LR1 SnapSession | OK 2026-08-09 — enter/hold; Esc limpia; no en historial |
| LR1-B Restart Chain | OK 2026-08-09 — reinicio sin mutar doc/historial |
| LR2 CompositeCommand | OK 2026-08-09 — undo/redo atómico; fallo = rollback |
| LR3 Spatial Reference | OK 2026-08-09 — A–D en `@axonbim/model` + session; tests verdes |
| WP-v1 Workplane | OK 2026-08-09 — plano storey derivado; muro/Viewport; sin persistir |
| WP-v2 Planos tangibles | OK 2026-08-09 — select/línea/nivel; overlay; tests |
| SK-v1 Sketch Mode | OK 2026-08-09 — rectángulo en Workplane; undo atómico de 4 muros |
| SK-sel Sketch selección | OK 2026-08-09 — muro; Dibujar reutilizado |
| SK-draw Dibujar | OK 2026-08-09 — 6 modos; tests tools + session |
| SK-profile / SK-replace v0 | OK código 2026-08-09 — deuda producto: silueta libre → N muros (solape) |
| SK-profile-one | **pendiente auth** — un único perfil al Terminar |

### Bugs de checklist (cerrados / aceptados)

| ID | Estado |
|----|--------|
| **BUG-C** máscara crop cámara | **corregido** 2026-08-08 |
| **BUG-D4** flip controls vs zoom | **aceptado por ahora** 2026-08-08 |

---

## Hilos de soporte (no desplazan la cola LR)

### Proceso (Hilo A)

| ID | Pendiente | Estado |
|----|-----------|--------|
| **A1** | Repo público + branch protection | **cerrado** 2026-08-08 |
| **A2** | Mantener docs al cerrar gates | Práctica continua |
| **A3** | Límite conocido de CI | Contract tests + e2e |

### Deuda técnica (Hilo B) — cerrada

| ID | Estado |
|----|--------|
| **B5** session / viewer monolitos | **cerrado** |
| **B6** invariantes en dominio | **cerrado** — ADR 0017 · F9-E |

### Decisiones de producto (Hilo C) — cerradas

| ID | Estado |
|----|--------|
| **C1** Umbrales clic | **cerrado (MVP)** |
| **C2** Bundle ~834 kB | **cerrado (MVP)** |
| **C3** Crop en más vistas | **cerrado** 2026-08-09 |

---

## Qué está cerrado (referencia rápida)

| Área | Cierre | Dónde |
|------|--------|-------|
| F5-S, F8, ADR 0014–0016 | 2026-08-07/08 | gates |
| Auditoría P1–P5 | 2026-08-08 | technical-audit |
| Desacople Fases 0–3 | 2026-08-08 | este doc, gates |
| A1 protección remota | 2026-08-08 | github.md |
| F9-E E1–E6 | 2026-08-09 | ADR 0017, domain-invariants-plan |
| Fase 4 · C3 | 2026-08-09 | ADR 0016 |
| LR0 plan integración selectiva | 2026-08-09 | legacy-reuse-roadmap + migration |
| LR1 SnapSession + histéresis | 2026-08-09 | `@axonbim/tools` snap + session `snapSession` |
| LR1-B Restart Chain | 2026-08-09 | `restartChainAt` + Ribbon Reiniciar |
| LR2 CompositeCommand | 2026-08-09 | `packages/commands` composite + tests |

F9-E detalle: [`domain-invariants-plan.md`](domain-invariants-plan.md).
