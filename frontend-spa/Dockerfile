FROM node:18-alpine

WORKDIR /app

ARG REACT_APP_KEYCLOAK_URL
ARG REACT_APP_REALM
ARG REACT_APP_CLIENT_ID
ARG REACT_APP_API_URL

ENV REACT_APP_KEYCLOAK_URL=$REACT_APP_KEYCLOAK_URL \
    REACT_APP_REALM=$REACT_APP_REALM \
    REACT_APP_CLIENT_ID=$REACT_APP_CLIENT_ID \
    REACT_APP_API_URL=$REACT_APP_API_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
