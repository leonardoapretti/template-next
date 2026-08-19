#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="/var/www/template-next"
BRANCH="main"
LOCK_FILE="/tmp/template-next-deploy.lock"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

log() {
  echo ""
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

on_error() {
  local line="$1"
  echo ""
  echo "Deploy falhou na linha $line."
  cd "$PROJECT_DIR" || true
  echo ""
  echo "Status atual dos containers:"
  $COMPOSE ps || true
  echo ""
  echo "Logs recentes da aplicação:"
  $COMPOSE logs --tail=100 app || true
  exit 1
}

trap 'on_error $LINENO' ERR

exec 200>"$LOCK_FILE"
flock -n 200 || {
  echo "Já existe um deploy em andamento. Abortando."
  exit 1
}

log "Entrando no projeto..."
cd "$PROJECT_DIR"

log "Verificando branch..."
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "Branch atual: $CURRENT_BRANCH"
  echo "Branch esperada: $BRANCH"
  exit 1
fi

log "Atualizando código..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

log "Buildando imagem..."
$COMPOSE build --progress=plain app

log "Subindo containers..."
$COMPOSE up -d

log "Garantindo aplicação atualizada..."
$COMPOSE up -d app

log "Status dos containers..."
$COMPOSE ps

log "Limpando recursos Docker não utilizados..."
docker builder prune -f
docker image prune -f

log "Uso de disco:"
df -h /
docker system df || true

log "Deploy finalizado com sucesso."
