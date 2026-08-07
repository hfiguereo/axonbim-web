# ADR 0001 — Web-first, local-first

## Estado

Aceptado

## Contexto

El desktop acopló UI y dominio en dos procesos. Para un producto evaluable en el navegador hace falta simplificar el runtime.

## Decisión

AxonBIM Web es una aplicación **web** que opera **local-first**: el modelo vive en el cliente; no requiere servidor de aplicación propio para el MVP.

## Consecuencias

- Dominio y UI en el mismo runtime TypeScript
- Sin JSON-RPC interno obligatorio
- Persistencia inicial por archivo `.axon` (descarga/apertura), no IndexedDB/OPFS como primario en MVP
