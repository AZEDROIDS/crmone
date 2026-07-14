#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-fly.sh — Déploiement complet ESN Manager sur Fly.io
# Usage : bash deploy-fly.sh
# Durée estimée : 4-6 minutes
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Couleurs ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

APP_NAME="esn-manager"
DB_NAME="esn-manager-db"
REGION="cdg"   # Paris

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║        ESN Manager — Déploiement Fly.io           ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# ── 1. Vérifier flyctl ───────────────────────────────────────────────────────
info "Vérification de flyctl..."
if ! command -v flyctl &>/dev/null && ! command -v fly &>/dev/null; then
  warn "flyctl non installé. Installation en cours..."
  curl -L https://fly.io/install.sh | sh
  export PATH="$HOME/.fly/bin:$PATH"
fi
FLY=$(command -v flyctl 2>/dev/null || command -v fly)
success "flyctl trouvé : $($FLY version)"

# ── 2. Vérifier l'authentification ───────────────────────────────────────────
info "Vérification de l'authentification Fly.io..."
if ! $FLY auth whoami &>/dev/null; then
  warn "Non connecté. Ouverture du navigateur pour authentification..."
  $FLY auth login
fi
USER=$($FLY auth whoami)
success "Connecté en tant que : $USER"

# ── 3. Créer l'application ───────────────────────────────────────────────────
info "Création de l'application '$APP_NAME'..."
if $FLY apps list | grep -q "^$APP_NAME"; then
  warn "L'application '$APP_NAME' existe déjà — on continue"
else
  $FLY apps create "$APP_NAME" --org personal
  success "Application '$APP_NAME' créée dans la région $REGION"
fi

# ── 4. Créer PostgreSQL ───────────────────────────────────────────────────────
info "Création de la base de données PostgreSQL..."
if $FLY postgres list | grep -q "$DB_NAME"; then
  warn "Base '$DB_NAME' déjà existante — on continue"
else
  $FLY postgres create \
    --name "$DB_NAME" \
    --region "$REGION" \
    --vm-size shared-cpu-1x \
    --volume-size 3 \
    --initial-cluster-size 1
  success "Base PostgreSQL '$DB_NAME' créée"
fi

# ── 5. Attacher la DB à l'app ─────────────────────────────────────────────────
info "Attachement de la base à l'application..."
$FLY postgres attach "$DB_NAME" --app "$APP_NAME" 2>/dev/null \
  || warn "Base déjà attachée — on continue"
success "Base attachée (DATABASE_URL configurée automatiquement)"

# ── 6. Générer les secrets ────────────────────────────────────────────────────
info "Configuration des secrets..."

AUTH_SECRET=$(openssl rand -base64 32)
APP_URL="https://${APP_NAME}.fly.dev"

echo ""
echo "┌─────────────────────────────────────────────────────┐"
echo "│  Entrez vos clés API (laisser vide pour skipper)    │"
echo "└─────────────────────────────────────────────────────┘"
read -rp "  RESEND_API_KEY (re_XXXXXXXXXX) : " RESEND_KEY
read -rp "  EMAIL_FROM (ex: noreply@mondomaine.fr) : " EMAIL_FROM
EMAIL_FROM="${EMAIL_FROM:-ESN Manager <noreply@${APP_NAME}.fly.dev>}"

$FLY secrets set \
  AUTH_SECRET="$AUTH_SECRET" \
  NEXT_PUBLIC_APP_URL="$APP_URL" \
  NEXTAUTH_URL="$APP_URL" \
  NODE_ENV="production" \
  --app "$APP_NAME"

if [[ -n "$RESEND_KEY" ]]; then
  $FLY secrets set RESEND_API_KEY="$RESEND_KEY" EMAIL_FROM="$EMAIL_FROM" --app "$APP_NAME"
  success "Clé Resend configurée"
else
  warn "RESEND_API_KEY non fournie — les emails seront désactivés"
fi
success "Secrets configurés"

# ── 7. Déployer ───────────────────────────────────────────────────────────────
info "Déploiement de l'application (2-4 min)..."
$FLY deploy \
  --app "$APP_NAME" \
  --region "$REGION" \
  --strategy rolling \
  --wait-timeout 300

success "Application déployée !"

# ── 8. Migrations DB ──────────────────────────────────────────────────────────
info "Application des migrations de base de données..."
$FLY ssh console --app "$APP_NAME" -C "cd /app && npx drizzle-kit migrate"
success "Migrations appliquées"

# ── 9. Seed de démonstration ──────────────────────────────────────────────────
echo ""
read -rp "Voulez-vous créer des données de démonstration ? (o/N) : " DO_SEED
if [[ "$DO_SEED" =~ ^[oO]$ ]]; then
  info "Seed des données de démonstration..."
  $FLY ssh console --app "$APP_NAME" -C "cd /app && npx tsx db/seed.ts"
  success "Données de démonstration créées"
fi

# ── 10. Ouvrir l'application ─────────────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║          🎉 DÉPLOIEMENT TERMINÉ !                 ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║  URL      : https://${APP_NAME}.fly.dev           "
echo "║  Dashboard: https://fly.io/apps/${APP_NAME}       "
echo "╠═══════════════════════════════════════════════════╣"
echo "║  Comptes de démonstration :                       ║"
echo "║  Admin      : admin@mon-esn.fr / admin1234        ║"
echo "║  Consultant : jean.dupont@mon-esn.fr / jean1234   ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║  ⚠️  RÉVOQUEZ votre token Fly.io maintenant :     ║"
echo "║  fly.io/user/personal_access_tokens               ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

$FLY open --app "$APP_NAME"
