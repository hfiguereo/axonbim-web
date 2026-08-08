#!/usr/bin/env bash
# Fase 0 — repo público + branch protection en main.
# Ejecutar manualmente con gh autenticado (cambios remotos sensibles).
set -euo pipefail

REPO="${1:-hfiguereo/axonbim-web}"
BRANCH="${2:-main}"

echo "==> Visibilidad pública (ADR 0007: propietario, no OSS automático)"
gh repo edit "$REPO" --visibility public --accept-visibility-change-consequences

echo "==> Branch protection en $BRANCH (sin force-push ni borrado)"
# gh api -f envía todo como string; la API exige JSON con boolean/null reales.
#
# Sin required_status_checks a propósito: los workflows se disparan CON el push, así que
# exigirlos rechaza todo push directo a main (GH006). Ver docs/roadmap/github.md.
gh api \
  -X PUT \
  "repos/$REPO/branches/$BRANCH/protection" \
  --input - <<EOF
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

echo "==> Hecho. Verifica en GitHub → Settings → Branches."
