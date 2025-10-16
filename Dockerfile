# Stage 1: Build both GUI and Backend
FROM node:20-alpine AS build

# Install pnpm
RUN npm install -g pnpm@8.15.0

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all apps
COPY apps ./apps

# Install dependencies for all workspaces
RUN pnpm install --frozen-lockfile

# Build all apps with Turborepo (GUI + Backend)
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# Stage 2: Backend runtime image
FROM node:20-alpine AS backend

# Install pnpm and dumb-init for proper signal handling
RUN npm install -g pnpm@8.15.0 && \
    apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy backend package.json only (no workspace needed for runtime)
COPY apps/backend/package.json ./package.json

# Create a minimal pnpm-lock.yaml for the backend dependencies
# We'll install from the backend's package.json directly
RUN pnpm install --prod && \
    pnpm store prune

# Copy built backend from builder
COPY --from=build --chown=nodejs:nodejs /app/apps/backend/dist ./dist

# Switch to non-root user
USER nodejs

# Expose backend port (3000 for HTTP + WebSocket)
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the backend in HTTP mode (includes WebSocket support)
CMD ["node", "dist/main-http.js"]

# Stage 3: Frontend production image with Nginx
FROM docker.io/library/nginx:stable-alpine3.17 AS frontend

# Copy built GUI from build stage
COPY --from=build /app/apps/gui/dist /usr/share/nginx/html

# Configure nginx for SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    location / { \
        try_files $uri /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
