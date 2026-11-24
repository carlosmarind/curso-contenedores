FROM node:24 AS builder
WORKDIR /usr/app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm test
RUN pnpm lint
RUN pnpm build

FROM node:24 AS builder-prod
WORKDIR /usr/app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM node:24-alpine AS runner
WORKDIR /usr/app
COPY --from=builder /usr/app/dist ./dist
COPY --from=builder /usr/app/package.json .
COPY --from=builder-prod /usr/app/node_modules ./node_modules
CMD ["node","dist/main.js"] 