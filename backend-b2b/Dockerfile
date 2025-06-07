FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .



ENV PORT 3002
EXPOSE 3002

CMD ["node", "script.js"]