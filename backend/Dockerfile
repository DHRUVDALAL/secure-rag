# ---------- BUILDER ----------
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Pre-download the embedding model so the production image has it cached
ENV TRANSFORMERS_CACHE=/app/.cache/transformers
RUN node -e "import('@xenova/transformers').then(m=>m.pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2')).then(()=>console.log('model cached'))"


# ---------- PRODUCTION ----------
FROM node:20

WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

ENV TRANSFORMERS_CACHE=/app/.cache/transformers

RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 4000

CMD ["node", "dist/index.js"]
