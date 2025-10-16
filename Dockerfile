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
# Enable remote control for Docker builds (WebSocket auto-detects URL from browser)
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV VITE_REMOTE_CONTROL_ENABLED=true
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

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Copy startup script
COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Change ownership
RUN chown -R nodejs:nodejs /app && \
    chown -R nodejs:nodejs /usr/share/nginx/html && \
    chown -R nodejs:nodejs /var/lib/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    chown -R nodejs:nodejs /run/nginx

USER nodejs

# Expose both ports (documentation only - actual mapping in docker-compose.yml)
EXPOSE 80 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start both nginx and backend
CMD ["sh", "/app/start.sh"]
