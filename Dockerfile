FROM oven/bun:1 AS builder
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "bun.lock", "./"]

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1
ENV NODE_ENV=production
ENV FIRST=false

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/index.ts ./index.ts
COPY --from=builder /app/config.ts ./config.ts
COPY --from=builder /app/src ./src

EXPOSE 8080

CMD ["bun", "--smol", "run", "start"]
