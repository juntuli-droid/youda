FROM node:20-alpine AS base

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/game-assets/package.json ./packages/game-assets/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter api build

EXPOSE 3000

CMD ["pnpm", "--filter", "api", "start:prod"]
