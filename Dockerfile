# Сборка: URL бэкенда задаётся build-arg (Render → Docker → Build Command / build args)
# В runtime nginx только отдаёт статику; axios ходит на VITE_API_BASE из собранного бандла.

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Обязательно для prod: полный URL API без слэша в конце (https://your-api.onrender.com)
ARG VITE_API_BASE
ARG VITE_WS_URL
ARG VITE_MAP_PROVIDER=yandex
ARG VITE_MAP_BLOCK_SECONDS=22

ENV VITE_API_BASE=$VITE_API_BASE \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_MAP_PROVIDER=$VITE_MAP_PROVIDER \
    VITE_MAP_BLOCK_SECONDS=$VITE_MAP_BLOCK_SECONDS

RUN test -n "$VITE_API_BASE" || (echo "ERROR: build with --build-arg VITE_API_BASE=https://your-backend..." && exit 1)
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=10000

EXPOSE 10000
