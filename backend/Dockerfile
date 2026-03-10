# ─── Base ───
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ─── Dependencies ───
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# ─── Builder ───
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json ./
COPY prisma ./prisma/
RUN npm ci
COPY src ./src/
RUN npx prisma generate && npm run build

# ─── Production ───
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S fastify -u 1001

# Copy production node_modules (with pruned deps)
COPY --from=deps --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=fastify:nodejs /app/prisma ./prisma

# Copy compiled output
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/package.json ./

USER fastify

EXPOSE 4000

CMD ["node", "dist/src/server.js"]
