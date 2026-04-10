FROM node:20-alpine AS base

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/game-assets/package.json ./packages/game-assets/

RUN pnpm install --frozen-lockfile

# Copy the rest of the files
COPY . .

# Build the applications
RUN pnpm run build

# Start the primary production app
CMD ["pnpm", "--filter", "web", "start"]
