# --- build stage -------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- runtime stage -----------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Default to the remote SSE transport in a container; override MCP_TRANSPORT=stdio to
# run as a spawned stdio server instead.
ENV MCP_TRANSPORT=http
ENV PORT=8083
EXPOSE 8083

USER node
CMD ["node", "dist/index.js"]
