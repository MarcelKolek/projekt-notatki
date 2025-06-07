# frontend-spa/Dockerfile

FROM node:18-alpine

WORKDIR /app

# Krok 1: instalacja zależności
COPY package.json package-lock.json ./
RUN npm ci

# Krok 2: kopiujemy cały kod
COPY . .

# Krok 3: budujemy aplikację (React -> static files)
RUN npm run build

# Krok 4: instalujemy "serve", aby serwować statyczną buildowaną wersję
RUN npm install -g serve

EXPOSE 3000

# Krok 5: uruchamiamy serwer plików statycznych
CMD ["serve", "-s", "build", "-l", "3000"]