FROM node:22-alpine AS base

ENV TZ=America/Sao_Paulo

RUN apk add --no-cache \
  tzdata \
  libc6-compat \
  openssl \
  git \
  curl \
  && cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
  && echo "America/Sao_Paulo" > /etc/timezone

RUN npm install -g pnpm@10.24.0


FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


FROM base AS builder

WORKDIR /app

ARG DATABASE_URL
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG DB_NAME

ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

ARG AUTH_SECRET
ARG AUTH_URL

ARG ENCRYPTION_KEY

ARG RESEND_API_KEY
ARG RESEND_FROM_EMAIL
ARG EMAIL_DESTINATARIO_DEV

ENV DATABASE_URL=$DATABASE_URL \
  DB_HOST=$DB_HOST \
  DB_PORT=$DB_PORT \
  DB_USER=$DB_USER \
  DB_PASSWORD=$DB_PASSWORD \
  DB_NAME=$DB_NAME \
  NEXTAUTH_URL=$NEXTAUTH_URL \
  NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
  AUTH_SECRET=$AUTH_SECRET \
  AUTH_URL=$AUTH_URL \
  ENCRYPTION_KEY=$ENCRYPTION_KEY \
  RESEND_API_KEY=$RESEND_API_KEY \
  RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL \
  EMAIL_DESTINATARIO_DEV=$EMAIL_DESTINATARIO_DEV

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate
RUN pnpm test
RUN pnpm audit --prod
RUN pnpm build


FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

RUN chmod +x ./scripts/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
