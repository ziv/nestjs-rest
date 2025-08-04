FROM node:24-alpine3.21 as build

WORKDIR /app

RUN npm install -g npm@latest

COPY ./dist/packages/demo/main.js ./dist/packages/demo/main.js
COPY package.json ./
COPY package-lock.json ./
COPY packages/ ./packages/

RUN npm ci --no-fund --no-audit --no-progress

CMD ["node", "dist/packages/demo/main.js"]

