#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="/var/www/template-next"
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

# Guarda a imagem em produção para rollback se o novo container não subir.
if docker image inspect template-next-app:latest >/dev/null 2>&1; then
  docker tag template-next-app:latest template-next-app:anterior
fi

log "Buildando imagem..."
$COMPOSE build --progress=plain app

log "Subindo aplicação..."
if ! $COMPOSE up -d --wait --wait-timeout 120 app; then
  echo "Container não ficou saudável."
  if docker image inspect template-next-app:anterior >/dev/null 2>&1; then
    echo "Voltando para a imagem anterior..."
    docker tag template-next-app:anterior template-next-app:latest
    $COMPOSE up -d --no-build app
  fi
  exit 1
fi

log "Status dos containers..."
$COMPOSE ps

log "Limpando recursos Docker não utilizados..."
docker builder prune -f
docker image prune -f

log "Uso de disco:"
df -h /
docker system df || true

log "Deploy finalizado com sucesso."
