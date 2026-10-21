FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
RUN npm ci --omit=dev --workspace server --include-workspace-root=false
COPY server ./server
# Generate during build without a real connection or deployment secrets.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run db:generate --workspace server
ENV NODE_ENV=production
USER node
WORKDIR /app/server
EXPOSE 3001
CMD ["node", "src/server.js"]
