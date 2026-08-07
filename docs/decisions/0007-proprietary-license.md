# ADR 0007 — Licencia propietaria

## Estado

Aceptado

## Contexto

El desktop AxonBIM usaba GPL-3. AxonBIM Web es un producto nuevo, sin copiar código de ese árbol ni de otro software libre con copyleft. Se consumirán **estándares abiertos** (p. ej. IFC como formato/especificaciones) sin adoptar el copyleft de implementaciones concretas salvo acuerdo explícito.

El autor necesita control sobre:

- quién puede modificar y redistribuir;
- comercialización y términos de uso;
- futuros acuerdos de licencia (p. ej. dual-licensing o licencias comerciales).

Licencias permisivas (MIT, Apache-2.0) **no** dan ese control: permiten a terceros comercializar forks libremente. GPL **obliga** a compartir derivados bajo GPL.

## Decisión

AxonBIM Web se publica bajo **copyright propietario — All Rights Reserved** (ver `LICENSE`).

- Estándares abiertos (IFC, etc.): uso como especificación/intercambio, sin compromiso copyleft del producto.
- Dependencias de terceros: solo con licencia compatible con uso propietario, o encapsuladas bajo términos claros; no se introducirá copyleft fuerte sin autorización.
- El código del desktop GPL **no** se copia a este repositorio.

## Consecuencias

- `LICENSE` deja de ser GPL-3
- README y reglas de agente reflejan licencia propietaria
- Cualquier apertura futura (OSS o source-available restrictiva) requiere ADR nuevo y autorización explícita
