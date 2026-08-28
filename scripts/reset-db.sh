#!/usr/bin/env bash
set -Eeuo pipefail

# Reset diário do banco da demo pública (truncate geral + reseed do admin).
# Este template fica exposto publicamente pra teste sem cadastro prévio, e os
# dados que visitantes criam se acumulam — este script limpa tudo de volta ao
# estado inicial.
#
# Agendar via crontab da VPS, rodando à meia-noite (America/Sao_Paulo):
#   0 0 * * * /var/www/template-next/scripts/reset-db.sh >> /var/log/template-next-reset.log 2>&1

PROJECT_DIR="/var/www/template-next"
LOCK_FILE="/tmp/template-next-reset.lock"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

log() {
  echo ""
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

exec 200>"$LOCK_FILE"
flock -n 200 || {
  echo "Já existe um reset em andamento. Abortando."
  exit 1
}

log "Entrando no projeto..."
cd "$PROJECT_DIR"

log "Resetando banco de dados..."
$COMPOSE exec -T app pnpm db:reset-demo

log "Reset finalizado com sucesso."
