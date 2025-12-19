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

# Build the application
RUN pnpm run build


# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl postgresql-client && rm -rf /var/lib/apt/lists/* && npm install -g pnpm
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

RUN pnpm prisma generate

RUN echo "Checking files..." && ls -la ./dist/ && echo "Files copied successfully"

COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
