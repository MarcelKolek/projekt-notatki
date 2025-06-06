# frontend-spa/Dockerfile

FROM node:18-alpine

WORKDIR /app

# 1. Instalujemy zależności (w tym react-scripts)
COPY package.json package-lock.json ./
RUN npm ci

# 2. Kopiujemy cały kod aplikacji
COPY . .

# 3. Budujemy aplikację: teoretycznie "react-scripts build" stworzy folder "build"
#    z plikami statycznymi (bundle.js, index.html, itp.)
RUN npm run build

# 4. Instalujemy "serve", by serwować zawartość folderu build
RUN npm install -g serve

EXPOSE 3000

# 5. Serwujemy produkcyjną wersję (build) na porcie 3000
CMD ["serve", "-s", "build", "-l", "3000"]
