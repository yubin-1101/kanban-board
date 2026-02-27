FROM node:22-slim
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/server apps/server

WORKDIR /app/apps/server
EXPOSE 3001
CMD ["node_modules/.bin/tsx", "src/index.ts"]
