# ADR 0002 — Documento paramétrico como fuente de verdad

## Estado

Aceptado

## Contexto

Hace falta una única autoridad del edificio para evitar divergencias entre UI, malla y archivo.

## Decisión

`AxonDocument` es la fuente de verdad. Los comandos lo mutan. Las vistas solo representan resultados. React y Three.js no poseen el modelo.

## Consecuencias

- Paquete de modelo sin imports de UI/viewer
- Selección/cámara pueden vivir en UI state
- Serialización `.axon` deriva del documento
