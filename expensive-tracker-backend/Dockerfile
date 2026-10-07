FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p public/uploads storage/receipts \
    && addgroup -S app \
    && adduser -S -G app app \
    && chown -R app:app /app

EXPOSE 3001

USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3001/health || exit 1

CMD ["npm", "start"]
