# =========================================================
# Multi-stage Dockerfile para NestJS Backend (AVA UniVC)
# =========================================================

# 1. Estágio de Build
FROM node:22-alpine AS builder

WORKDIR /app

# Instala ferramentas necessárias para compilação nativa se necessário
RUN apk add --no-cache openssl

# Copia manifestos de pacotes e schema do Prisma
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Instala todas as dependências
RUN npm ci

# Gera o cliente Prisma
RUN npx prisma generate

# Copia o código fonte e compila
COPY src ./src/
RUN npm run build

# 2. Estágio de Produção
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV APP_NAME=ava-univc-backend
ENV HTTP_PORT=3001
ENV PORT=3001

# Copia dependências e artefatos compilados do estágio anterior
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Cria diretório para uploads de arquivos
RUN mkdir -p /app/uploads

EXPOSE 3001

# Script de inicialização: sincroniza banco e inicia a aplicação
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main.js"]
