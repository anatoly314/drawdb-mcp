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
  --name drawdb-mcp \
  -p 8080:80 \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/anatoly314/drawdb-mcp:latest
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
git clone https://github.com/anatoly314/drawdb-mcp
cd drawdb-mcp
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
docker build -t drawdb-mcp:local .
docker run -p 8080:80 -p 3000:3000 drawdb-mcp:local
```

The Docker image includes both frontend and backend. WebSocket is proxied through Nginx.

### Updating to New Versions

When updating to a new version (whether via Docker or local development), **you must perform a hard refresh in your browser** to clear the cached frontend JavaScript:

- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **macOS**: `Cmd + Shift + R`

Without a hard refresh, the browser may continue using the old cached frontend code even though the backend has been updated, which can cause errors or unexpected behavior.

## Features

### Export & Import

The MCP server provides tools for exporting and importing database diagrams in multiple formats:

**Export Formats:**
- **SQL DDL**: Export database-specific SQL statements (PostgreSQL, MySQL, SQLite, MariaDB, MSSQL, Oracle)
- **DBML**: Export to Database Markup Language (human-readable, database-agnostic format)
- **JSON**: Export complete diagram state for backup/restore

**Import Formats:**
- **DBML**: Import database schemas from DBML format
- **JSON**: Import complete diagram state

**Available MCP Tools:**
- `export_sql` - Export diagram as SQL DDL for current database type
- `export_dbml` - Export diagram as DBML
- `import_dbml` - Import database schema from DBML
- `export_diagram` - Export complete diagram as JSON
- `import_diagram` - Import complete diagram from JSON

See [CLAUDE.md](./CLAUDE.md) for complete list of available MCP tools and their usage.
