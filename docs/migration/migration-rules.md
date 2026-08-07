# Reglas de migración desde AxonBIM desktop

## Qué significa portar

```
Código anterior → comportamiento observado → caso de prueba → invariante
  → especificación → implementación nueva (TypeScript)
```

**No** significa traducir Python/GDScript a TypeScript ni copiar módulos.

## Formas permitidas de uso del legado

1. Concepto / invariante  
2. Especificación leída con juicio  
3. Oráculos numéricos de tests  
4. Lecciones negativas  

El árbol Godot/Python permanece **fuera** de este repositorio (p. ej. zip en `~/Descargas`).

## Ficha obligatoria

Cada componente heredado relevante debe figurar en [legacy-inventory.md](legacy-inventory.md) con:

| Campo | Contenido |
|-------|-----------|
| Archivo / área anterior | Ruta o nombre |
| Responsabilidad | Qué hacía |
| Estado real | confirmado / parcial / solo documental |
| Comportamiento útil | Qué conservar |
| Problema detectado | Si aplica |
| Casos de prueba | Oráculos |
| Invariantes | Reglas |
| Destino web | Paquete / doc |
| Decisión | ver abajo |

## Decisiones

| Decisión | Significado |
|----------|-------------|
| CONSERVAR COMO CONCEPTO | Idea válida; reescribir |
| PORTAR PRUEBAS | Reescribir casos, no archivos |
| REESCRIBIR | Función necesaria; implementación nueva |
| APLAZAR | Válida pero no MVP |
| DESCARTAR | No justificar complejidad |
| VERIFICAR PRIMERO | Docs ≠ código; investigar antes |

## Regla anti-alucinación

Si un `.md` del desktop describe una API que el código no implementa, **no se porta**. Se marca VERIFICAR o DESCARTAR. Manda el comportamiento observado en código/tests.
