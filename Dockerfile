# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite-переменные для сборки
ARG VITE_OIDC_AUTHORITY
ARG VITE_OIDC_CLIENT_ID
ARG VITE_OIDC_REDIRECT_URI
ARG VITE_OIDC_SCOPE
ARG VITE_BACKEND_API

ENV VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
ENV VITE_OIDC_REDIRECT_URI=$VITE_OIDC_REDIRECT_URI
ENV VITE_OIDC_SCOPE=$VITE_OIDC_SCOPE
ENV VITE_BACKEND_API=$VITE_BACKEND_API

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Копируем собранные статические файлы из builder-стадии в директорию Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем нашу конфигурацию Nginx
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Nginx будет слушать этот порт внутри контейнера
EXPOSE 80

# Команда для запуска Nginx
CMD ["nginx", "-g", "daemon off;"]