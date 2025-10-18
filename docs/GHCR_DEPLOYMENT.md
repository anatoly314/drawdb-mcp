# GitHub Container Registry Deployment

DrawDB Docker images are automatically built and published to GitHub Container Registry (GHCR) on every push to main/develop branches and on version tags.

## Available Images

Images are available at: `ghcr.io/anatoly314/drawdb`

## Tags

The following tags are automatically generated:

- `latest` - Latest build from main branch
- `main` - Latest build from main branch
- `develop` - Latest build from develop branch
- `main-<sha>` - Specific commit from main branch
- `v*` - Semantic version tags (e.g., `v1.0.0`, `v1.0`)

## Pull and Run

### Quick Start (One Command)

```bash
docker run \
  --name drawdb \
  -p 8080:80 \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/anatoly314/drawdb:latest
```

Then access:

- **GUI**: http://localhost:8080
- **MCP Server**: http://localhost:3000 (for AI assistants)

### Using docker-compose (recommended for production)

```yaml
version: '3.8'

services:
  drawdb:
    image: ghcr.io/anatoly314/drawdb:latest
    container_name: drawdb
    ports:
      - '8080:80' # GUI and WebSocket (proxied through nginx)
      - '3000:3000' # Direct MCP server access for Claude Desktop/LLM clients
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

Save as `docker-compose.yml` and run:

```bash
docker-compose up -d
```

## Authentication

Images are public by default. If you need to authenticate:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Build Workflow

Images are built using GitHub Actions on:

- Push to `main` or `develop` branches
- Creation of version tags (e.g., `v1.0.0`)
- Pull requests to `main` (build only, no push)

See `.github/workflows/docker-publish.yml` for the complete workflow.

## Image Contents

Each image contains:

- **Frontend**: React application served by nginx on port 80
- **Backend**: NestJS MCP server on port 3000
- **WebSocket**: Remote control for AI assistants (proxied through nginx at `/remote-control`)

The image uses Alpine Linux for minimal size and runs as a non-root user for security.

## Making Images Public

After the first push, the package will be private by default. To make it public:

1. Go to https://github.com/anatoly314/drawdb/packages
2. Click on the package
3. Click "Package settings"
4. Scroll to "Danger Zone"
5. Click "Change visibility" → "Public"

## Advanced Usage

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: drawdb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: drawdb
  template:
    metadata:
      labels:
        app: drawdb
    spec:
      containers:
        - name: drawdb
          image: ghcr.io/anatoly314/drawdb:latest
          ports:
            - containerPort: 80
              name: http
            - containerPort: 3000
              name: mcp
          env:
            - name: NODE_ENV
              value: 'production'
```

### Environment Variables

The following environment variables can be configured:

- `NODE_ENV` - Set to `production` for production deployments
- `VITE_REMOTE_CONTROL_ENABLED` - Already set to `true` in the image
- `VITE_REMOTE_CONTROL_WS` - Override WebSocket URL (auto-detected by default)

## Troubleshooting

### Cannot pull image

- Ensure the package is set to public
- If private, authenticate with `docker login ghcr.io`

### WebSocket not connecting

- Check that port 80 or your mapped port is accessible
- WebSocket URL is auto-detected from browser location

### MCP server not accessible

- Ensure port 3000 is exposed and mapped correctly
- For Claude Desktop, use `http://localhost:3000` as the MCP endpoint
