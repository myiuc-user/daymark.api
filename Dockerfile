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
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl postgresql-client && npm install -g pnpm
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts

RUN pnpm prisma generate

EXPOSE 3001

CMD ["sh", "-c", "sleep 10 && pnpm prisma db push && node src/app.js"]
