FROM node:22-slim AS base
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

RUN pnpm install --frozen-lockfile --prod=false

COPY packages/shared packages/shared
COPY apps/server apps/server

WORKDIR /app/apps/server
RUN pnpm build

FROM node:22-slim
RUN npm install -g pnpm
WORKDIR /app

COPY --from=base /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml ./
COPY --from=base /app/packages/shared/package.json packages/shared/
COPY --from=base /app/apps/server/package.json apps/server/
RUN pnpm install --frozen-lockfile --prod

COPY --from=base /app/packages/shared/dist packages/shared/dist
COPY --from=base /app/apps/server/dist apps/server/dist

WORKDIR /app/apps/server
EXPOSE 3001
CMD ["node", "dist/index.js"]
