FROM node:24-alpine AS base

FROM base AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build-front && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/random-gif.db

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 random-gif \
    && mkdir -p /app/data \
    && chown random-gif:nodejs /app/data

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/static ./static

RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev \
    && npm cache clean --force \
    && apk del python3 make g++

USER random-gif

EXPOSE 8080
VOLUME ["/app/data"]
ENV PORT=8080

CMD ["node", "dist/index.js"]
