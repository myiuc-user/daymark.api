# Stage 1: Build dependencies
FROM node:20 as builder

WORKDIR /app

# 🛠️ Correct order to avoid pnpm lockfile mismatch
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies in one layer
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Generate Prisma client first
RUN pnpm run db:generate

# Build the application
RUN pnpm run build


# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Install system dependencies including Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    postgresql-client \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/common/services/*.hbs ./dist/common/services/

RUN pnpm prisma generate

RUN echo "Checking files..." && ls -la ./dist/ && echo "Files copied successfully"

# Create reports directory
RUN mkdir -p reports

COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
