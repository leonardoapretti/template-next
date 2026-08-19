#!/bin/sh
set -e

echo "Aplicando migrations pendentes..."
pnpm prisma migrate deploy

echo "Iniciando aplicação..."
exec pnpm start
