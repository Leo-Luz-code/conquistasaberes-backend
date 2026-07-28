#!/bin/sh
set -e

echo "Criando/atualizando tabelas do banco..."
npx prisma db push

echo "Povoando banco com dados mockados (Seed)..."
npx prisma db seed

echo "Iniciando aplicação..."
exec pm2-runtime ecosystem.config.js