# Stage 1: Build dependencies
FROM node:18-slim as builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Stage 2: Runtime
FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl postgresql-client && rm -rf /var/lib/apt/lists/* && npm install -g pnpm

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts

RUN pnpm prisma generate

EXPOSE 3001

CMD ["sh", "-c", "sleep 10 && pnpm prisma db push && node src/app.js"]
