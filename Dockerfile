FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN apk add --no-cache postgresql-client

EXPOSE 3001

CMD ["sh", "-c", "sleep 10 && npm start"]