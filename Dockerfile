FROM node:25-alpine AS base

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

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# O .env entra como secret do BuildKit (montado só durante o RUN) para não
# deixar secrets nas camadas nem no histórico da imagem.
RUN --mount=type=secret,id=env,target=/app/.env pnpm prisma generate
RUN --mount=type=secret,id=env,target=/app/.env pnpm test
RUN --mount=type=secret,id=env,target=/app/.env pnpm build


FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
# Sem isso o server.js standalone herda o HOSTNAME que o Docker atribui ao
# container (o container ID) e o Next bind só nessa interface — fica
# inacessível das outras redes docker (ex.: a rede `web` do Caddy).
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/public ./.next/standalone/public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/standalone/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

RUN chmod +x ./scripts/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
