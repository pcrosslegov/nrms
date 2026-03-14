# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/packages/frontend
COPY packages/frontend/package*.json ./
RUN npm ci
COPY packages/frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/packages/backend
COPY packages/backend/package*.json ./
RUN npm ci
COPY packages/backend/ ./
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache dumb-init chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user for OpenShift compatibility
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    mkdir -p /app/uploads && chown -R appuser:appgroup /app

COPY --from=backend-build --chown=appuser:appgroup /app/packages/backend/dist ./dist
COPY --from=backend-build --chown=appuser:appgroup /app/packages/backend/node_modules ./node_modules
COPY --from=backend-build --chown=appuser:appgroup /app/packages/backend/package.json ./
COPY --from=backend-build --chown=appuser:appgroup /app/packages/backend/prisma ./prisma
COPY --from=frontend-build --chown=appuser:appgroup /app/packages/frontend/dist ./public

USER 1001

ENV NODE_ENV=production
ENV STORAGE_PATH=/app/uploads
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health/live || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
