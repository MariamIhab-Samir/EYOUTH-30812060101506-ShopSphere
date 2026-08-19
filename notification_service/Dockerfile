FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --only=production
COPY --from=builder /usr/src/app ./
EXPOSE 5002
CMD ["node", "app.js"]