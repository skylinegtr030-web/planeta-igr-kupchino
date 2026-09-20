FROM node:22-alpine
WORKDIR /app

# Устанавливаем зависимости сервера
COPY server/package.json ./server/package.json
RUN cd server && npm install --omit=dev

# Копируем весь проект в /app/site
COPY . ./site

# Переносим node_modules туда, откуда запускается сервер
# (server/index.js лежит в /app/site/server/, require ищет модули рядом)
RUN cp -r /app/server/node_modules /app/site/server/node_modules \
    && mkdir -p /app/data/orders /app/site/uploads

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "/app/site/server/index.js"]
