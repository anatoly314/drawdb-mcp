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

## What's New: AI-Powered Database Design

This fork extends the original DrawDB with **AI assistant integration** via Model Context Protocol (MCP). AI assistants like Claude can now create, modify, and manage database diagrams programmatically through a WebSocket API.

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
