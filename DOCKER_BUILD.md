# Docker Build Guide

This monorepo builds a single Docker image that includes both the frontend and backend.

## Image Description

The Docker image includes:
- **Frontend (GUI)**: React app served by Nginx on port 80
- **Backend (MCP Server)**: Node.js app with WebSocket support on port 3000 (proxied through Nginx)

Both services run in the same container for simplicity.

## Build Locally

```bash
docker build -t drawdb:local .
```

## Run Locally

```bash
docker run -p 8080:80 drawdb:local
```

Access the application at http://localhost:8080

The WebSocket connection is automatically proxied through Nginx at http://localhost:8080/remote-control

## Jenkins Pipeline

The Jenkinsfile builds the image using Kaniko and pushes to Harbor registry:

- **Image**: `harbor.anatoly.dev/drawdb/drawdb:latest`
- **Tagged**: `harbor.anatoly.dev/drawdb/drawdb:{branch}-{commit}`

## Dockerfile Stages

1. **build**: Builds both GUI and Backend using pnpm + Turborepo
2. **production**: Single runtime image with Nginx + Node.js, running both frontend and backend

## Environment Variables

The backend runs on port 3000 internally, but is only accessible through the Nginx proxy on port 80. No environment variables are needed for basic usage.

## How It Works

1. Nginx listens on port 80
2. Static files (React app) are served directly by Nginx
3. WebSocket requests to `/remote-control` are proxied to the Node.js backend on port 3000
4. Both processes run in the same container using a simple startup script
