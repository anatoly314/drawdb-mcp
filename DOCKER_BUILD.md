# Docker Build Guide

This monorepo builds two separate Docker images from a single Dockerfile using multi-stage builds.

## Images Produced

1. **Frontend (GUI)**: Nginx serving the React app
2. **Backend (MCP Server)**: Node.js app with WebSocket support

## Build Locally

### Build Frontend Image
```bash
docker build --target frontend -t drawdb-gui:local .
```

### Build Backend Image
```bash
docker build --target backend -t drawdb-backend:local .
```

### Run Locally

**Frontend:**
```bash
docker run -p 8080:80 drawdb-gui:local
# Access at http://localhost:8080
```

**Backend:**
```bash
docker run -p 3000:3000 drawdb-backend:local
# WebSocket at ws://localhost:3000/remote-control
# MCP HTTP at http://localhost:3000
```

## Jenkins Pipeline

The Jenkinsfile builds both images using Kaniko and pushes to Harbor registry:

- **Frontend**: `harbor.anatoly.dev/drawdb/drawdb-gui:latest`
- **Backend**: `harbor.anatoly.dev/drawdb/drawdb-backend:latest`

Each build also gets a tag with branch name and git commit:
- `harbor.anatoly.dev/drawdb/drawdb-gui:{branch}-{commit}`
- `harbor.anatoly.dev/drawdb/drawdb-backend:{branch}-{commit}`

## Dockerfile Stages

1. **build**: Builds both GUI and Backend using pnpm + Turborepo
2. **backend**: Production Node.js image with built backend
3. **frontend**: Production Nginx image with built GUI

## Environment Variables

### Frontend (Build-time)
These are baked into the frontend build:

- `VITE_REMOTE_CONTROL_ENABLED` - Enable WebSocket connection to backend
- `VITE_REMOTE_CONTROL_WS` - WebSocket URL (default: ws://localhost:3000/remote-control)

### Backend (Runtime)
These can be set when running the container:

- `PORT` - HTTP server port (default: 3000)
- `HOST` - Host to bind to (default: 127.0.0.1)

Example:
```bash
docker run -p 3000:3000 -e HOST=0.0.0.0 drawdb-backend:local
```

## Production Deployment

For production, you'll typically want:

1. **Frontend**: Behind an ingress/load balancer
2. **Backend**: Accessible from frontend for WebSocket connections
3. **Environment**: Set `VITE_REMOTE_CONTROL_WS` to point to backend WebSocket endpoint

Example for Kubernetes deployment - frontend needs to connect to backend:
```yaml
# Frontend build with production backend URL
VITE_REMOTE_CONTROL_ENABLED=true
VITE_REMOTE_CONTROL_WS=wss://drawdb-backend.yourdomain.com/remote-control
```
