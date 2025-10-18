<div align="center">
    <img width="64" alt="drawdb logo" src="./apps/gui/src/assets/icon-dark.png">
    <h1>drawDB + MCP Server</h1>
</div>

This fork of [DrawDB](https://github.com/drawdb-io/drawdb) extends the original with **AI assistant integration** via Model Context Protocol (MCP). AI assistants like Claude can now create, modify, and manage database diagrams programmatically through a WebSocket API.

### Demo Video

[![DrawDB MCP Integration Demo](https://img.youtube.com/vi/O1PnbgKI0K0/0.jpg)](https://youtu.be/O1PnbgKI0K0)

Watch how to design database schemas using natural language with Claude AI.

**Architecture:**

- **apps/gui**: Original React-based DrawDB frontend
- **apps/backend**: NestJS MCP server that enables AI assistants to control the diagram editor
- Built with [Turborepo](https://turbo.build/repo) and [pnpm workspaces](https://pnpm.io/workspaces)

## Getting Started

### Quick Start with Docker (Recommended)

The easiest way to get started is using Docker:

```bash
docker run \
  --name drawdb \
  -p 8080:80 \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/anatoly314/drawdb:latest
```

Then:

1. **Open GUI**: http://localhost:8080
2. **Connect Claude Code** to the MCP server:

```bash
claude mcp add --transport http drawdb-mcp http://127.0.0.1:3000
```

Now Claude can create and modify database diagrams for you!

See [GHCR_DEPLOYMENT.md](./docs/GHCR_DEPLOYMENT.md) for available tags and advanced usage.

### Local Development

#### Prerequisites

- Node.js 20+
- pnpm 8.15.0+ (install via `npm install -g pnpm`)

**Start both GUI and backend:**

```bash
git clone https://github.com/drawdb-io/drawdb
cd drawdb
pnpm install
pnpm dev
```

**Start GUI only:**

```bash
pnpm gui:dev
# Access at http://localhost:5173
```

**Start backend only:**

```bash
pnpm backend:dev
# WebSocket at ws://localhost:3000/remote-control
```

### Build

**Build both applications:**

```bash
pnpm install
pnpm build
```

**Build specific app:**

```bash
pnpm build --filter=gui
pnpm build --filter=backend
```

#### Connect Claude Code to MCP Server

When running locally, connect Claude Code:

```bash
claude mcp add --transport http drawdb-mcp http://127.0.0.1:3000
```

The frontend automatically connects to the backend via WebSocket for real-time updates.

### Docker Deployment

See [DOCKER_BUILD.md](./docs/DOCKER_BUILD.md) for detailed build instructions.

**Build with Docker Compose:**

```bash
docker-compose up --build
# Access at http://localhost:8080
```

**Or build directly:**

```bash
docker build -t drawdb:local .
docker run -p 8080:80 -p 3000:3000 drawdb:local
```

The Docker image includes both frontend and backend. WebSocket is proxied through Nginx.

If you want to enable sharing, set up the [server](https://github.com/drawdb-io/drawdb-server) and environment variables according to `.env.sample`. This is optional unless you need to share files.
