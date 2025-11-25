# Stage 1: Build dependencies
FROM node:20 as builder

WORKDIR /app

# 🛠️ Correct order to avoid pnpm lockfile mismatch
COPY package.json ./

# Install pnpm and dependencies in one layer
RUN npm install -g pnpm
RUN pnpm install

# Copy source files
COPY . .


# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl postgresql-client && rm -rf /var/lib/apt/lists/* && npm install -g pnpm
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/app.js ./src/
COPY --from=builder /app/src/config ./src/config
COPY --from=builder /app/src/middleware ./src/middleware
COPY --from=builder /app/src/routes ./src/routes
COPY --from=builder /app/src/services ./src/services
COPY --from=builder /app/src/utils ./src/utils
COPY --from=builder /app/scripts ./scripts

RUN pnpm prisma generate

COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
