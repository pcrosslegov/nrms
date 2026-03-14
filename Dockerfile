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

# Stage 3: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache dumb-init

COPY --from=backend-build /app/packages/backend/dist ./dist
COPY --from=backend-build /app/packages/backend/node_modules ./node_modules
COPY --from=backend-build /app/packages/backend/package.json ./
COPY --from=backend-build /app/packages/backend/prisma ./prisma
COPY --from=frontend-build /app/packages/frontend/dist ./public

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
