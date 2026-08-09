# Paradigmas de edición y referencias espaciales

**Estado:** WP-v1 (referencia espacial compartida) **cerrada** 2026-08-09.
Sketch / Edit Mode / Family Editor / Push&Pull siguen **parked**.

Fuente adaptada 2026-08-07. Separar claramente:

| Paradigma | Uso | No hacer |
|-----------|-----|----------|
| **Parametric Edit** | Props, grips, comandos de elementos BIM (muros, puertas, ventanas) | Deformación libre genérica |
| **Sketch Mode** | Perfiles/contornos de elementos paramétricos | Convertir el BIM en malla libre |
| **Edit Mode** | Familias / modelado in-place (futuro) | Ser el editor habitual de puertas/muros |

## Principio

Work planes / referencias espaciales = infraestructura inteligente (inferir cuando sea inequívoco; mostrar; permitir fijar). No burocracia constante tipo productos de referencia rígidos, ni ambigüedad total.

Los tres paradigmas **comparten** `SpatialReferenceContext` / `Workplane` (WP-v1) y **no** comparten reglas de edición.

Push & Pull pertenece a **Edit Mode**, no a Parametric Edit.

Detalle: [`workplanes-roadmap.md`](../roadmap/workplanes-roadmap.md). API: `@axonbim/model` (`resolveSpatialReference`, `getActiveWorkplane`).
