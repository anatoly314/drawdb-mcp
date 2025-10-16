<div align="center">
  <sup>Special thanks to:</sup>
  <br>
  <a href="https://www.warp.dev/drawdb/" target="_blank">
    <img alt="Warp sponsorship" width="280" src="https://github.com/user-attachments/assets/c7f141e7-9751-407d-bb0e-d6f2c487b34f">
    <br>
    <b>Next-gen AI-powered intelligent terminal for all platforms</b>
  </a>
</div>

<br/>
<br/>

<div align="center">
    <img width="64" alt="drawdb logo" src="./apps/gui/src/assets/icon-dark.png">
    <h1>drawDB</h1>
</div>

<h3 align="center">Free, simple, and intuitive database schema editor and SQL generator.</h3>

<div align="center" style="margin-bottom:12px;">
    <a href="https://drawdb.app/" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/Start%20building-grey" alt="drawDB"/>
    </a>
    <a href="https://discord.gg/BrjZgNrmR6" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/discord/1196658537208758412.svg?label=Join%20the%20Discord&logo=discord" alt="Discord"/>
    </a>
    <a href="https://x.com/drawDB_" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/Follow%20us%20on%20X-blue?logo=X" alt="Follow us on X"/>
    </a>
    <a href="https://getmanta.ai/drawdb">
        <img src="https://getmanta.ai/api/badges?text=Manta%20Graph&link=drawdb" alt="DrawDB graph on Manta">
    </a> 
</div>

<h3 align="center"><img width="700" style="border-radius:5px;" alt="demo" src="drawdb.png"></h3>

DrawDB is a robust and user-friendly database entity relationship (DBER) editor right in your browser. Build diagrams with a few clicks, export sql scripts, customize your editor, and more without creating an account. See the full set of features [here](https://drawdb.app/).

This is a monorepo built with [Turborepo](https://turbo.build/repo) and [pnpm workspaces](https://pnpm.io/workspaces), containing:
- **apps/gui**: React-based frontend application
- **apps/backend**: NestJS-based MCP (Model Context Protocol) server for AI assistant integration

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8.15.0+ (install via `npm install -g pnpm`)

### Local Development

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

### AI Assistant Remote Control

The backend MCP server enables AI assistants (like Claude) to create and modify database diagrams via WebSocket. To enable this feature:

1. Create `apps/gui/.env`:
```bash
VITE_REMOTE_CONTROL_ENABLED=true
VITE_REMOTE_CONTROL_WS=ws://localhost:3000/remote-control
```

2. Start both frontend and backend:
```bash
pnpm dev
```

The frontend will automatically connect to the backend and display connection status.

### Docker

See [DOCKER_BUILD.md](./docs/DOCKER_BUILD.md) for detailed Docker build and deployment instructions.

**Quick start with Docker Compose (recommended):**

```bash
# Build and run (rebuilds fresh image every time)
docker-compose up --build

# Access at http://localhost:8080
```

**Or using Docker directly:**

```bash
docker build -t drawdb:local .
docker run -p 8080:80 drawdb:local
# Access at http://localhost:8080
```

The Docker image includes both the frontend and backend running together. The WebSocket connection is automatically proxied through Nginx.

If you want to enable sharing, set up the [server](https://github.com/drawdb-io/drawdb-server) and environment variables according to `.env.sample`. This is optional unless you need to share files.
