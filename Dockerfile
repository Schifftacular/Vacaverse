# Build the frontend (pure JS/TS build, alpine is fine — no native deps here)
FROM node:22-alpine AS client-build
WORKDIR /app/app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

# Runtime: server + the built frontend as static files.
# node:22-slim (glibc, Debian-based) rather than alpine — better-sqlite3 is a
# native module and glibc has broader prebuilt-binary coverage than musl,
# avoiding a from-source compile in the image.
FROM node:22-slim
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=client-build /app/app/dist ./app/dist

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/auth/me', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server/index.js"]
