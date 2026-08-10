# Matriz de aceptación — post-MVP (cortes autorizados)

Complementa [acceptance-matrix.md](acceptance-matrix.md) (MVP estricto, cerrada).  
Cada fila = feature ya habilitada por ADR/gate. Una fila no está “hecha” si no se puede
ejercer **desde la interfaz** (salvo evidencia solo automatizada marcada como tal).

| Feature | Contrato funcional | Invariante de dominio | Evidencia auto | Manual / visual | Undo/Redo | Roundtrip `.axon` |
|---------|-------------------|----------------------|----------------|-----------------|-----------|-------------------|
| **Puertas** (ADR 0010) | Colocar en muro; props familia/bisagra/swing/hoja; borrar | `validateDoor` + `validateHostedOpening` | `hostedOpening`, `validation`, e2e o2 | Colocar / solape rechazado | Sí (comando) | Sí (Abrir estricto) |
| **Ventanas** (ADR 0011) | Idem hospedadas; alféizar | Idem ventana + solape mutuo con puertas | Idem | Idem | Sí | Sí |
| **Cámaras** (ADR 0015) | Vista→Cámara ojo+mira; props FOV/altura/nombre; pestaña navegador | `validateCamera` | commands camera tests; e2e o2; lifecycle E4 | Crear / undo pestaña | Sí (doc); tabs derivadas E4 | Sí (`cameras[]`) |
| **Crop región** (ADR 0016 + C3) | Planta: crop real; cámara: marco CSS + grips (no mutan crop); zoom bloqueado | `validateViewCrop`; cámara.crop obligatorio | viewCrop + cropScreenFrame + presentationPersist | Grip cámara no cambia Ancho/Fondo; planta sí | Crop sesión: no historial; crop cámara: sí | Crop activado → `presentation.viewCrops`; cámara → `Camera.crop` |
| **Gizmo / navegación 3D** (ADR 0014) | Tríada ±ejes, órbita, pivot modelo/selección | N/A (viewer) | viewer unit; checklist nav | Checklist `navigation-3d-checklist.md` | N/A | N/A |
| **Frontera `.axon`** (F9-E5) | Abrir duro; Recuperar con informe; Exportar limpio | Predicados E1/E2 en parse | persistence axon tests; e2e smoke E5 | Checklist E5 OK | N/A (reemplaza doc) | Aceptado → aceptado |
| **Catálogos documento** (F9-E3) | Familias del `.axon` son SoT en sesión | `find*Family` / reconcile | catalog + persistence custom family | Selector tras Abrir archivo custom | N/A | Catálogo custom roundtrip |

## Notas

- Solape puerta↔ventana: mensaje UI «Hay otro hueco demasiado cerca» (código `opening.overlap`).
- Recuperar copia no sustituye Abrir: es vía B explícita (menú **Recuperar copia…**).
- Filas nuevas (IFC, OCCT, Edit Mode, …) **prohibidas** aquí hasta ADR + autorización en chat.
- **WP-v1** / **SK-v1**: ver workplanes-roadmap + editing-paradigms (rectángulo usable en UI).

**Gate documental F9-E6:** esta matriz + docs de arquitectura coinciden con el código en la
fecha de cierre E6.
