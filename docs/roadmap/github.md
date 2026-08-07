# GitHub — remoto principal

## Intención

- Copia de trabajo: este directorio (`~/Documentos/axonbim-web`)
- Remoto principal: `origin` → GitHub repo `axonbim-web`

## Estado

- Commit de fundación en `main` (local): presente
- Remoto `origin`: **pendiente** — requiere autenticación GitHub en esta máquina
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

## Política

- Rama por defecto: `main`
- No mezclar historial del desktop AxonBIM
- Sin secretos en el repositorio
