FROM node:24.22.1-bookworm-slim AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# prisma.config.ts exige DATABASE_URL; `prisma generate` no se conecta a la BD.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm build
RUN pnpm prune --prod

FROM node:24.22.1-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

# Misma ruta (/app) que en la etapa build: pnpm usa enlaces simbólicos dentro de node_modules.
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts /app/package.json ./

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/main"]
