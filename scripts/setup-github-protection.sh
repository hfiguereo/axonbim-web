#!/usr/bin/env bash
# Fase 0 — repo público + branch protection en main.
# Ejecutar manualmente con gh autenticado (cambios remotos sensibles).
set -euo pipefail

REPO="${1:-hfiguereo/axonbim-web}"
BRANCH="${2:-main}"

echo "==> Visibilidad pública (ADR 0007: propietario, no OSS automático)"
gh repo edit "$REPO" --visibility public --accept-visibility-change-consequences

echo "==> Branch protection en $BRANCH (checks: ci + e2e)"
gh api \
  -X PUT \
  "repos/$REPO/branches/$BRANCH/protection" \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]='Typecheck + unit tests' \
  -f required_status_checks.contexts[]='Playwright F8' \
  -f enforce_admins=true \
  -f required_pull_request_reviews=null \
  -f restrictions=null \
  -f allow_force_pushes=false \
  -f allow_deletions=false

echo "==> Hecho. Verifica en GitHub → Settings → Branches."
