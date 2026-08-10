# Plan de integración selectiva — extracto operativo

El documento completo está en
[plan-integracion-selectiva-logica-reutilizable.pdf](plan-integracion-selectiva-logica-reutilizable.pdf).

Cola viva y gates por bloque: [`../roadmap/legacy-reuse-roadmap.md`](../roadmap/legacy-reuse-roadmap.md).
Inventario: [`legacy-inventory.md`](legacy-inventory.md). Reglas:
[`migration-rules.md`](migration-rules.md).

Ante duda, prevalecen el PDF + ADR / arquitectura vigentes. Este extracto no autoriza
implementar features.

## Principio

Reutilizar **comportamiento, reglas, algoritmos conceptuales, invariantes y casos de
prueba** del Desktop. **Nunca** trasladar arquitectura antigua ni copiar código GPL /
Python / GDScript.

```
Desktop → extraer comportamiento → invariantes → contrato Web → tests Web
  → implementación TypeScript nueva → gate
```

## Condiciones (PDF §1)

1. Adaptarse a la arquitectura actual de AxonBIM Web.
2. No reinstalar dependencias o patrones del Desktop.
3. No introducir funcionalidad antes de que su fase esté autorizada.
4. Convertir el conocimiento heredado en contratos Web **antes** de implementarlo.

## Estado respecto al plan actual (2026-08-09)

| Pieza del PDF | Estado en repo |
|---------------|----------------|
| S1–S6 (estabilización integridad) | **Cerrada** como F9-E E1–E6 |
| C3 Crop | **Cerrada** (marco CSS + nav lock; crop real en planta) |
| LR0 formalización | **Cerrada** (indexado + hilo en `pending-work.md`) |
| LR1 SnapSession | **Cerrada** 2026-08-09 |
| LR1-B Restart Chain | **Cerrada** 2026-08-09 |
| LR2 CompositeCommand | **Cerrada** 2026-08-09 |
| LR3-A…D Spatial Reference | **Cerrada** 2026-08-09 |
| WP-v1 Workplane | **Cerrada** 2026-08-09 |
| SK-v1 Sketch Mode | **Cerrada** 2026-08-09 (rectángulo) |
| Edit Mode / expansiones | **Siguiente** (auth) |

Hilo operativo único: [`../roadmap/pending-work.md`](../roadmap/pending-work.md).

## Bloques LR (resumen)

| Bloque | Tema | Prioridad | Momento |
|--------|------|-----------|---------|
| **LR0** | Formalizar legado útil (docs) | Alta | Ahora (docs) |
| **LR1** | SnapSession + histéresis | Alta | Post-estabilización; auth Fase 4 |
| **LR1-B** | Restart Chain | Alta | Tras LR1 |
| **LR2** | Command Transactions / Composite | Alta | Tras contrato validez (hecho) |
| **LR3-A** | Active Storey | Muy alta | Antes de workplanes |
| **LR3-B** | Storey Datum | Alta | Tras LR3-A |
| **LR3-C** | Model Envelope (derivado) | Alta | Preparación espacial |
| **LR3-D** | Project North / Projection Basis | Alta, bajo coste | Antes de vistas técnicas |
| **LR4** | Technical View Core | Alta futuro | Parked (doc 2D) |
| **LR5** | Render invalidation | Media | Parked (evidencia de coste) |
| **LR6** | IFC Recognition Policy | Doc alta / impl. parked | Antes de importador IFC |
| **LR7** | Grid adaptativo / datums UX | Baja | Tras LR3; solo UX |

## Prohibiciones explícitas (PDF §21)

- Wall joins mutando `p1`/`p2` (Web ya usa eje + join directions → malla).
- Godot, JSON-RPC interno, Python como núcleo geométrico, SQLite History.
- Código GPL (solo comportamiento / matemáticas / tests / conceptos).
- IFC como SoT interno.
- Planos técnicos desde todas las aristas trianguladas.

## Etapas recomendadas (PDF §22)

| Etapa | Contenido | Nota 2026-08-09 |
|-------|-----------|-----------------|
| A | S1–S6 | Hecho (F9-E) |
| B | LR0 docs | Este indexado |
| C | LR1 (+ LR1-B) | Hecho |
| D | LR2 + LR3-A…D | Hecho |
| E | Workplanes (WP-v1) | Hecho |
| F | Sketch Mode (SK-v1) | Hecho (rectángulo) |
| G | Edit Mode / expansiones | Auth explícita |
| H | LR4 Technical Views | Auth doc 2D |
| I | LR5 rendimiento | Con evidencia |
| J | LR6 → IFC | Auth IFC |

## Gate general (PDF §26)

Cerrar un bloque LR exige: problema + datos + invariantes + componentes + tests +
documentación + regresión — no basta con que compile o “parezca funcionar”.

## Informe mínimo antes de programar (PDF §3)

Problema · comportamiento recuperado · datos · invariantes · componentes Web · qué **no**
se reutiliza · tests.
