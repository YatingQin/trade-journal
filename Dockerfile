# 交易复盘 — Dockerfile
# 构建前端后由 Express 统一托管，适合 Render / Railway 等免费云托管

FROM node:18-bookworm-slim AS web-build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
RUN npm run build

FROM node:18-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

COPY server/ ./
COPY --from=web-build /app/web/dist /app/web/dist

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
