# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app

# Endereço do backend, embutido no bundle durante o build.
# Ex.: docker build --build-arg VITE_API_URL=http://meu-servidor:3000 .
# Vazio = o front chama /api na mesma origem (ideal atrás de um proxy).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
