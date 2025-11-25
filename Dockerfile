FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm prisma generate

EXPOSE 3001

CMD ["sh", "-c", "sleep 10 && pnpm prisma db push && pnpm start"]