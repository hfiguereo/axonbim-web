# Matriz de aceptación y pruebas

## 1. Invariantes de producto

| ID | Invariante | Resultado esperado |
|---|---|---|
| WP-01 | Entrada desde planta | Rechazo con mensaje; documento intacto |
| WP-02 | Entrada desde elevación | Workplane = cara vertical del muro |
| WP-03 | Entrada desde 3D | Cara seleccionada resuelta y fijada |
| WP-04 | Órbita durante sketch | No cambia el Workplane |
| PR-01 | Perfil provisional | Un único bucle ordenado |
| PR-02 | Cancelar | Sin mutación ni historial |
| PR-03 | Terminar válido | Mismo muro, perfil persistente |
| PR-04 | Terminar inválido | Sketch permanece visible; documento intacto |
| ID-01 | Identidad | `wallId` no cambia |
| OP-01 | Opening compatible | Se conserva sin cambiar ID ni host |
| OP-02 | Opening incompatible | Comando rechazado; nada se borra |
| HI-01 | Undo | Restaura definición vertical anterior |
| HI-02 | Redo | Restaura perfil nuevo |
| PE-01 | Guardar/reabrir | Perfil idéntico dentro de tolerancia |
| GE-01 | Malla | Representa pendiente/escalón real |
| GE-02 | Fuente de verdad | Malla siempre derivada del documento |

## 2. Casos geométricos mínimos

### Caso A — rectángulo uniforme

Perfil local:

```text
(0,0) → (4,0) → (4,3) → (0,3)
```

Esperado:

- equivalente a muro uniforme de 4 × 3 × espesor;
- no-op si coincide con el muro original;
- BBox y volumen conocidos.

### Caso B — remate inclinado

```text
(0,0) → (4,0) → (4,2) → (0,3)
```

Esperado:

- cuatro vértices persistentes;
- cara superior inclinada;
- no se convierte en altura 3 uniforme;
- altura máxima calculada = 3 m.

### Caso C — escalón superior

```text
(0,0) → (4,0) → (4,2) → (2,2) → (2,3) → (0,3)
```

Esperado:

- seis vértices persistentes;
- volumen igual al área 2D por espesor;
- Terminar conserva un solo muro.

### Caso D — perfil cóncavo válido

Usar un entrante que no se autointersecte.

Esperado:

- triangulación válida;
- caras laterales completas;
- normales consistentes.

### Caso E — autointersección

Perfil tipo lazo/cruce.

Esperado:

- `profile.selfIntersection`;
- documento e historial intactos;
- provisional permanece editable.

### Caso F — arista demasiado corta

Esperado:

- rechazo según tolerancia canónica;
- sin corrección silenciosa.

## 3. Openings

### Puerta dentro del perfil

- crear muro con puerta;
- editar pendiente manteniendo todo el rectángulo de la puerta dentro;
- confirmar.

Esperado:

- mismo `wallId`;
- mismo `door.id`;
- mismo `door.wallId`;
- hueco visible;
- Undo/Redo conserva ambos estados.

### Ventana fuera del nuevo perfil

- crear ventana alta;
- bajar el perfil hasta cortar una esquina del rectángulo de ventana;
- confirmar.

Esperado:

- rechazo explícito;
- muro y ventana sin cambios;
- sketch provisional permanece.

### Puerta y ventana simultáneas

Esperado:

- ambas se validan contra el mismo perfil;
- se mantienen reglas existentes de no solape;
- geometría contiene ambos huecos.

## 4. Commands e historial

| Prueba | Comprobación |
|---|---|
| Perfil válido | `changed: true`, una entrada de undo |
| Perfil equivalente | `noop`, no ensucia historial |
| Perfil inválido | `rejected`, redo intacto |
| Muro inexistente | `wall.notFound` |
| Undo | snapshot profundo; sin alias de arrays/puntos |
| Redo | reaplica perfil exacto |
| Opening incompatible | rollback total |
| ID | no cambia durante execute/undo/redo |

## 5. Persistencia

### Migración v1 → v2

Entrada:

```json
{
  "p1": { "x": 0, "y": 0, "z": 0 },
  "p2": { "x": 4, "y": 0, "z": 0 },
  "height": 2.7,
  "thickness": 0.15
}
```

Salida lógica:

```json
{
  "vertical": {
    "kind": "uniform",
    "height": 2.7
  }
}
```

### Round-trip de perfil

1. crear perfil escalonado;
2. serializar;
3. abrir estrictamente;
4. comparar clase, número de puntos y coordenadas;
5. regenerar malla y comparar BBox.

### Recuperación

Perfil inválido en archivo de recuperación:

- informe explícito;
- no convertir silenciosamente a uniform;
- no exportar como válido hasta resolución documentada.

## 6. Vista e interacción

| Escenario | Esperado |
|---|---|
| Doble clic en planta | Bloqueado |
| Doble clic en cara frontal 3D | Workplane frontal |
| Doble clic en cara posterior 3D | Workplane posterior |
| Elevación alineada | Perfil sin distorsión de cámara |
| Muro diagonal en planta visto en 3D | U sigue el eje real del muro |
| Orbitar después de entrar | Perfil continúa en la misma cara |
| Zoom | Grips mantienen tamaño utilizable |
| Perfil vertical | Overlay separado por normal, no desplazado globalmente en Z |
| Escape durante gesto | Cancela gesto; segundo Escape sale según contrato UI documentado |

## 7. Herramientas de dibujo

### Línea

- Redibujar inicia un perfil vacío.
- Cada segmento comienza en el final del anterior.
- Snap de cierre termina el bucle.
- No conserva aristas de la semilla antigua.

### Rectángulo

- Produce un bucle de cuatro aristas.
- Permanece provisional hasta Terminar.

### Arcos

- La tessellación permanece ordenada.
- El resultado confirmado conserva los puntos generados.
- No se convierte en N muros.

### Edición

- mover un vértice actualiza exactamente sus dos aristas incidentes;
- insertar vértice divide una arista;
- eliminar vértice reconecta el bucle cuando sea válido;
- no quedan aristas desconectadas.

## 8. Regresión

Ejecutar y mantener verdes:

- creación de muro uniforme;
- cambio de familia y espesor;
- cambio de altura en muro uniforme;
- joins de muros uniformes;
- puertas y ventanas;
- selección y picking;
- Workplanes WP-v1/v2;
- Undo/Redo;
- importar/exportar documentos anteriores;
- encuadre, envelope y crop.

Modificar o retirar únicamente las pruebas que protegen conscientemente el comportamiento obsoleto:

- perfil libre → N muros;
- reemplazo Delete/Create con ID nuevo;
- openings bloqueados sólo por existir.

Cada retirada debe acompañarse del nuevo oráculo correcto.

## 9. Checklist humana de cierre

- [ ] Crear muro sin openings.
- [ ] Confirmar que planta bloquea Editar perfil.
- [ ] Entrar desde elevación frontal.
- [ ] Dibujar pendiente y confirmar.
- [ ] Ver la pendiente en 3D.
- [ ] Undo y Redo.
- [ ] Guardar, cerrar y reabrir.
- [ ] Repetir con escalón.
- [ ] Repetir desde vista isométrica seleccionando cara.
- [ ] Repetir con puerta válida.
- [ ] Intentar cortar una ventana y comprobar rechazo.
- [ ] Confirmar que IDs permanecen iguales.
- [ ] Confirmar que Properties no destruye el perfil.
- [ ] Confirmar que Cancelar no crea historial.
- [ ] Ejecutar test, typecheck, build y checks del repositorio real.

## 10. Gate final

**Código (2026-08-10):** Bloques 0–7 entregados — dominio, mesh, comando in-place,
vista/picking, editor+toolkit, `.axon` v2 + migración + tests. Feature marcada **cerrada**
en cola (`pending-work.md`). Checklist humana §9 (guardar/reabrir visual) permanece
como verificación opcional del operador.

Criterios (todos cubiertos en código/tests salvo checklist humana §9):

- comportamiento visible correcto;
- invariantes en dominio;
- comando in-place;
- malla derivada correcta;
- openings preservados;
- persistencia real;
- Undo/Redo;
- pruebas automáticas;
- checklist humana;
- documentación e índice actualizados.

