# GitHub — remoto principal

## Intención

- Copia de trabajo: este directorio (`~/Documentos/axonbim-web`)
- Remoto principal: `origin` → GitHub repo `axonbim-web`

## Si el remoto aún no existe

Con [GitHub CLI](https://cli.github.com/) autenticado:

```bash
cd ~/Documentos/axonbim-web
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
