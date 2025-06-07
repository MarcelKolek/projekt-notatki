FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV PORT 3001
EXPOSE 3001

CMD ["npm", "run", "dev"]