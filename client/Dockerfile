FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
RUN npm ci --workspace client --include-workspace-root=false
COPY client ./client
RUN npm run build --workspace client

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/client/dist /srv
EXPOSE 80 443
