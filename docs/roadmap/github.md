# GitHub — remoto principal

## Intención

- Copia de trabajo: este directorio (`~/Documentos/axonbim-web`)
- Remoto principal: `origin` → GitHub repo `axonbim-web`

## Estado

- Remoto `origin`: https://github.com/hfiguereo/axonbim-web
- CLI local (si se instaló): `~/.local/bin/gh`

## Crear y publicar el remoto

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/Documentos/axonbim-web
gh auth login
gh repo create axonbim-web --private --source=. --remote=origin --push
```

O crear el repo vacío en la web y:

```bash
git remote add origin git@github.com:<usuario>/axonbim-web.git
git push -u origin main
```

## Integración continua (Actions)

Dos workflows independientes, para que un fallo de navegador y un fallo de tipos/tests
se distingan de un vistazo:

| Workflow | Corre | Desde |
|----------|-------|-------|
| `.github/workflows/ci.yml` | `pnpm typecheck` + `pnpm test` | 2026-08-08 |
| `.github/workflows/e2e.yml` | `pnpm test:e2e` (Playwright F8 o1 + o2) | 2026-08-08 (F8-CI) |

Ambos en `push` y `pull_request` sobre `main`. Actions con runtime Node 24
(`checkout@v5`, `setup-node@v5`, `pnpm/action-setup@v6`); toolchain Node 22, pnpm 10.12.1.

**Por qué `ci.yml` existe (2026-08-08):** hasta esa fecha el único workflow era el de
Playwright, así que «typecheck y tests verdes» era siempre la palabra de quien lo hubiera
corrido en local — nunca verificación independiente. Ahora cada push lo comprueba solo.

Cobertura de `pnpm test`: los **9 paquetes** tienen script de test y al menos un test
(2026-08-08). Ya no hay paquete que reporte verde sin ejecutar nada.

Límite conocido que **no** cubre este CI:

- `pnpm lint` no ejecuta nada: ningún paquete define script `lint`. No se añadió a CI
  para no dar una señal falsa de comodidad.

## Política

- Rama por defecto: **`main`**
- No mezclar historial del desktop AxonBIM
- Sin secretos en el repositorio (tokens de GitHub viven en `gh` / `~/.config/gh`, no en el repo)

### Protección frente a ramas accidentales (solo dueño)

Trabajo habitual **solo en `main`**. El agente **no** crea ramas nuevas salvo autorización **explícita en el chat** (p. ej. «autorizo crear la rama X»).

No cuentan como autorización de rama: aprobar un plan/ADR, «continúa», ni el botón de Cursor *create-branch-and-commit*. Ante esa acción de UI, el agente debe **rechazar crear la rama**, avisar, y operar en `main` si también se pidió commit/push.

Regla operativa: `.cursor/rules/40-git-and-scope.mdc`. Primacía del producto sobre el impulso: ADR 0006.

### Evento 2026-08-08 — merge de rama Cursor

- Rama de trabajo `cursor/windows-and-gizmo-cameras` (creada por diff-tab el 2026-08-07) **fusionada en `main`** a petición del dueño.
- Contenido principal: ventanas, gizmo/cámaras/crop (ADR 0014–0016), F5-S, Playwright F8 o1.
- A partir de aquí: **no** abrir más ramas `cursor/…` sin frase explícita; commits y push van a `main`.
- Refuerzo paralelo (sin reglas nuevas): ADR 0006 y gates — validación estricta de factores críticos aunque el dueño apresure.

## Git vs PR (uso diario)

### Solo tú, solo `main`

Con **git** basta:

1. Cambios locales → `commit`
2. `git push` / `git pull` en `main`

No hace falta Pull Request (PR).

### Qué es un PR

Un **PR** (Pull Request) es una petición en GitHub para **meter commits de una rama en otra** (casi siempre hacia `main`), con diff, comentarios y opción de revisión antes del merge.

### Si hay colaborador (o quieres revisar antes de tocar `main`)

1. Trabajar en **otra rama** (no directamente en `main`)
2. `git push` de esa rama
3. Abrir un **PR** hacia `main` (web de GitHub, o terminal con `gh pr create`)
4. Revisar y fusionar (`merge`)

Eso se puede hacer en la **web** o en **tu terminal** con `gh` (ya autenticado fuera del repo). El agente de Cursor puede usar `git` en el proyecto; `gh api` / `gh pr` desde el agente pueden estar limitados por la red del sandbox — en ese caso usar tu terminal o la web.

### Resumen

| Necesitas… | Herramienta |
|------------|-------------|
| Subir/bajar código | `git push` / `git pull` |
| Revisar e integrar rama → `main` | PR (web o `gh`) |
