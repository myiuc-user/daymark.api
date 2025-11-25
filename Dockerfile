# Stage 1: Build dependencies
FROM node:18-alpine as builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Stage 2: Runtime
FROM node:18-alpine

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
