# AxonBIM Web — paquete de auditoría de edición de perfil de muro

**Fecha:** 2026-08-10  
**Proyecto auditado:** `axonbim-web-main`  
**Objeto:** limitación de la edición de muros mediante Sketch Mode, Workplanes y herramientas de dibujo.

## Conclusión ejecutiva

La función actual no constituye todavía un editor de perfil vertical de muro. El usuario puede manipular un contorno provisional, pero el modelo de dominio sólo puede guardar un muro como eje, espesor y altura uniforme. Al pulsar **Terminar**, cualquier contorno vertical irregular se reduce a una envolvente rectangular y se materializa como otro muro de altura constante.

La limitación no está en Three.js. Ocurre antes del visor, en el contrato de `Wall`, en el generador `wallBoxMesh` y en el adaptador `commitSketchProfile`.

## Contenido del paquete

1. `01_AUDITORIA_TECNICA.md`  
   Diagnóstico completo, evidencias, discrepancias y consecuencias.

2. `02_ARQUITECTURA_Y_PLAN_DE_TRABAJO.md`  
   Contrato propuesto para un perfil vertical persistente, fases de implementación y componentes afectados.

3. `03_CADENA_DE_INSTRUCCIONES_PARA_CURSOR.md`  
   Secuencia operativa que Cursor debe seguir sin saltar gates ni convertir el cambio en una refactorización masiva.

4. `04_MATRIZ_DE_ACEPTACION_Y_PRUEBAS.md`  
   Invariantes, pruebas unitarias, integración, persistencia y validación manual.

## Regla de autorización

Este paquete documenta y prepara el cambio, pero no constituye por sí solo autorización para implementarlo. El repositorio exige autorización explícita para abrir el siguiente bloque.

Frase recomendada:

> Autorizo redefinir SK-profile-one como SK-wall-profile-v1: perfil vertical persistente, edición sólo desde elevación/3D, commit en el mismo muro, validación geométrica y conservación de elementos hospedados.

## Resultado que Cursor debe alcanzar

- Un muro rectangular puede abrirse en edición de perfil desde una elevación ortográfica o una vista 3D.
- El sketch trabaja sobre la cara vertical real del muro.
- Las herramientas de dibujo producen un único contorno provisional cerrado.
- Una pendiente, escalón o remate irregular permanece igual después de **Terminar**, Undo/Redo y guardar/reabrir.
- El mismo `wallId` se conserva.
- Puertas y ventanas permanecen hospedadas si todavía caben; si no caben, el comando rechaza el perfil sin mutar el documento.
- Vista de planta no permite iniciar la edición vertical.

## Atajos prohibidos

- No resolverlo moviendo solamente dos vértices superiores o cambiando `height`.
- No convertir cada arista del contorno en un muro.
- No usar `DeleteWallCommand + CreateWallCommand` para editar un único muro.
- No almacenar el perfil en Zustand, Three.js, `Object3D.userData` o la malla.
- No borrar puertas/ventanas ni asignarles nuevos hosts silenciosamente.
- No añadir el perfil a `.axon` v1 sin una decisión formal de versión/migración.
- No incorporar OpenCascade para una extrusión planar que puede resolverse con geometría especializada.
- No declarar la función terminada únicamente porque compile o porque las pruebas antiguas continúen verdes.

