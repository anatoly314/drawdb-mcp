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

# Stage 2: Production image with both frontend and backend
FROM node:20-alpine

# Install pnpm, nginx, and dumb-init
RUN npm install -g pnpm@8.15.0 && \
    apk add --no-cache nginx dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy backend package.json and install production dependencies
COPY apps/backend/package.json ./package.json
RUN pnpm install --prod && pnpm store prune

# Copy built backend
COPY --from=build /app/apps/backend/dist ./dist

# Copy built frontend to nginx html directory
COPY --from=build /app/apps/gui/dist /usr/share/nginx/html

# Create nginx directories and configure nginx for SPA and proxy to backend
RUN mkdir -p /etc/nginx/conf.d /var/lib/nginx /var/log/nginx /run/nginx && \
    echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    \
    # Serve frontend \
    location / { \
        try_files $uri /index.html; \
    } \
    \
    # Proxy backend API and WebSocket \
    location /api/ { \
        proxy_pass http://localhost:3000/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
    \
    location /remote-control { \
        proxy_pass http://localhost:3000/remote-control; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Create startup script to run both nginx and backend
RUN printf '#!/bin/sh\nnginx\nexec node dist/main-http.js\n' > /app/start.sh && \
    chmod +x /app/start.sh

# Change ownership
RUN chown -R nodejs:nodejs /app && \
    chown -R nodejs:nodejs /usr/share/nginx/html && \
    chown -R nodejs:nodejs /var/lib/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    chown -R nodejs:nodejs /run/nginx

USER nodejs

# Expose only port 80 (nginx)
EXPOSE 80

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start both nginx and backend
CMD ["sh", "/app/start.sh"]
