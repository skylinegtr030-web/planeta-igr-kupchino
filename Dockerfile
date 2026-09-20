FROM node:22-alpine

# Статика сайта — отдельно от сервера
WORKDIR /app/site
COPY . .

# Сервер — своя директория, здесь же node_modules
WORKDIR /app/server
COPY server/package.json ./package.json
RUN npm install --omit=dev

# Переносим исходник сервера в его директорию
COPY server/ ./

# Папки для данных
RUN mkdir -p /app/data/orders /app/site/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV SITE_ROOT=/app/site
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

WORKDIR /app/server
CMD ["node", "index.js"]
