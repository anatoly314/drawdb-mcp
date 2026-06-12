# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DrawDB is a database entity relationship diagram editor with AI integration via Model Context Protocol (MCP). It's a Turborepo monorepo containing:

- **apps/gui**: React-based frontend (original DrawDB UI)
- **apps/backend**: NestJS MCP server that enables AI assistants to create/modify diagrams programmatically

The backend runs a WebSocket server that the frontend connects to for real-time diagram manipulation. AI assistants like Claude can control the diagram editor through MCP tools over HTTP.

**Tests:** There are **no unit tests** in `apps/gui` or `apps/backend` — don't look for `npm test` inside the apps. There **is** an end-to-end suite (added in v1.3.0) at `tests/e2e/` (Jest, package `@drawdb-mcp/e2e`) with 9 specs that drive the MCP tools against a fully-running Docker stack: `tables`, `fields`, `relationships`, `areas`, `notes`, `enums`, `types`, `diagram`, `export-import`.

Run it against a locally-built image:

```bash
docker build -t drawdb-mcp:local .
DRAWDB_E2E_IMAGE=drawdb-mcp:local pnpm e2e:ci   # or pnpm e2e
```

It needs the Docker image and Playwright chromium (`pnpm --filter @drawdb-mcp/e2e exec playwright install chromium --with-deps`). CI (`.github/workflows/e2e.yml`) builds `drawdb-mcp:e2e-<sha>` and runs `pnpm e2e:ci`. The e2e suite is the real acceptance gate for any change touching the MCP layer or entity contexts — build/lint/type-check alone miss MCP-layer runtime failures. For quick spot-checks, exercise the apps through the MCP Inspector or the GUI.

## Essential Commands

### Prerequisites

- Node.js **20+** (backend's `engines` field is the strict one; root `package.json` understates this)
- pnpm 8.15.0+

### Development

**Start both apps in parallel:**

```bash
pnpm dev
```

**Start individual apps:**

```bash
pnpm gui:dev        # GUI only → http://localhost:5173
pnpm backend:dev    # Backend only → http://localhost:3000
```

**Build / lint / format:**

```bash
pnpm build                  # Build both apps (Turborepo)
pnpm build --filter=gui     # Build GUI only
pnpm build --filter=backend # Build backend only
pnpm lint                   # Run linters for all apps
pnpm format                 # Format all code with Prettier
pnpm clean                  # Clean all build artifacts and node_modules
pnpm backend:inspector      # Launch MCP Inspector (STDIO mode)
```

**Backend-specific commands** (run from `apps/backend/`):

```bash
npm run type-check             # tsc --noEmit
npm run inspector:stdio        # Run MCP inspector for STDIO mode
npm run inspector:stdio:debug  # STDIO inspector with debugger on port 9229
npm run inspector:http         # Run MCP inspector for HTTP mode
npm run start:debug:stdio      # STDIO mode with debugger
npm run start:debug:http       # HTTP mode with debugger
```

### Docker

**Run from GHCR:**

```bash
docker run --name drawdb-mcp -p 8080:80 -p 3000:3000 ghcr.io/anatoly314/drawdb-mcp:latest
# GUI: http://localhost:8080
# MCP WebSocket: ws://localhost:3000/remote-control
```

**Build locally:**

```bash
docker-compose up --build    # Use docker-compose.yml
# OR
docker build -t drawdb-mcp:local .
docker run -p 8080:80 -p 3000:3000 drawdb-mcp:local
```

### Connect Claude Code to the MCP Server

When backend is running locally:

```bash
claude mcp add --transport http drawdb-mcp http://127.0.0.1:3000
```

## Architecture

### Monorepo Structure

This is a **pnpm workspaces + Turborepo** monorepo (converted from standalone app in commit `768d638`).

**Key files:**

- `package.json` - Root package with workspace scripts
- `pnpm-workspace.yaml` - Defines `apps/*` workspaces
- `turbo.json` - Turborepo pipeline configuration
- `apps/*/package.json` - Individual app dependencies and versions

**Build pipeline:**

- Turborepo handles parallel builds, caching, and task orchestration
- `turbo run build` builds both apps in dependency order
- Each app has independent dev servers but can run in parallel with `pnpm dev`

### Frontend (apps/gui)

**Stack:**

- React 18 + Vite
- Tailwind CSS 4 + Semi UI components
- React Router for navigation
- Dexie.js (IndexedDB) for local storage
- Monaco Editor for SQL/code editing
- Lexical for rich text notes

**State Management:**

React Context API with multiple specialized contexts under `src/context/`. The main one is `DiagramContext` (tables, relationships); others manage areas, notes, enums, types, canvas, undo/redo, settings, save state, transform, and selection. Read the directory listing for the full set rather than relying on this file.

**Key directories:**

- `src/components/` - React components (Canvas, SidePanel, Header, etc.)
- `src/context/` - Context providers
- `src/hooks/` - Custom React hooks (including `useRemoteControl.js` for WebSocket)
- `src/pages/` - Route pages (Editor, LandingPage, Templates)
- `src/data/` - Data utilities and converters
- `src/utils/` - Helper functions

**Remote Control Integration:**

- Frontend connects to backend via WebSocket at `/remote-control`
- Enabled when `VITE_REMOTE_CONTROL_ENABLED=true` (automatically set in Docker builds)
- WebSocket URL resolution (see `useRemoteControl.js:59`):
  - Uses `VITE_REMOTE_CONTROL_WS` env var if set
  - Otherwise auto-detects from `window.location` — `ws://` (or `wss://` over HTTPS), same host, path `/remote-control`. Works for both direct dev (`localhost:5173`) and Docker behind nginx (`localhost:8080`)
- **Single Active Connection**: Only one GUI can control the diagram at a time. New GUI connections gracefully close the previous one with the message "AI Assistant disconnected - connection taken over by another tab/window"
- Commands handled by entity contexts (`DiagramContext`, `AreasContext`, `NotesContext`, etc.)
- Reconnection: exponential backoff, max 10 attempts, up to 30s delay with jitter. Will NOT reconnect if the connection was replaced by another session
- All commands processed through the switch statement in `useRemoteControl.js`
- Command timeout: 30 seconds (`DrawDBClientService:15`)
- Heartbeat: frontend pings every 30 seconds

### Backend (apps/backend)

**Stack:**

- NestJS framework
- `@rekog/mcp-nest` - MCP server implementation
- WebSocket gateway for frontend connection
- Pino logger for structured logging

**Architecture:**

- **Entry Points:**
  - `src/main-http.ts` - HTTP mode (production, Docker)
  - `src/main-stdio.ts` - STDIO mode (MCP Inspector, testing)
  - `bin/drawdb-mcp.js` - CLI wrapper
- **Core Modules:**
  - `src/app.module.ts` - Root module with `forHttp()` and `forStdio()` factory methods
  - `src/drawdb/` - DrawDB integration module
    - `drawdb.gateway.ts` - WebSocket gateway listening on `/remote-control`
    - `drawdb-client.service.ts` - Sends commands to frontend via WebSocket
    - `drawdb.types.ts` - TypeScript types for commands/responses
- **MCP Primitives:**
  - `src/mcp/primitives/essential/tools/*.tool.ts` - Individual MCP tools. To see the full set, list this directory — it's authoritative
  - `src/mcp/primitives/essential/index.ts` - Module exports with `McpPrimitivesDrawDBModule.forRoot()` and the `MCP_PRIMITIVES` registration array

**Transport Modes:**

- **HTTP Mode** (production): NestJS HTTP server with WebSocket support. MCP endpoint at root `/`, frontend WebSocket at `/remote-control`. Default `http://127.0.0.1:3000`. Logger writes to stdout.
- **STDIO Mode** (development/testing): Standard input/output for MCP protocol. No HTTP server. Logger writes to stderr.

**WebSocket Flow:**

1. Frontend connects to `ws://localhost:3000/remote-control`
2. `DrawDBGateway` accepts connection, passes to `DrawDBClientService`
3. MCP tools call `DrawDBClientService.sendCommand()` with command name + params
4. Service sends JSON message over WebSocket, waits for response (30s timeout)
5. Frontend processes command in the appropriate context, sends result back
6. Service resolves the promise with the result data

### Docker Deployment

**Multi-stage build:**

1. **Stage 1 (build)**: Build both apps with Turborepo
2. **Stage 2 (production)**: Nginx + Node.js + backend + frontend
   - Nginx serves frontend from `/usr/share/nginx/html`
   - Nginx proxies `/api/` and `/remote-control` to backend on port 3000
   - Backend runs Node.js MCP server on port 3000
   - Both processes started by `docker/start.sh` using dumb-init

**Files:** `Dockerfile` (node:20-alpine multi-stage), `docker-compose.yml`, `docker/nginx.conf` (WebSocket proxy), `docker/start.sh` (entrypoint).

**Ports:** `80` (Nginx → GUI + proxied backend) and `3000` (Backend → MCP HTTP + WebSocket).

## Key Implementation Details

### MCP Tool Pattern

Each tool is an injectable NestJS service decorated with `@McpTool()`, validates input with a Zod schema, and calls `this.drawdbClient.sendCommand()` to execute a frontend command. See `apps/backend/src/mcp/primitives/essential/tools/add-table.tool.ts` for the canonical example.

**Tool catalog** is defined by the directory `apps/backend/src/mcp/primitives/essential/tools/` (one file per tool). Frontend command catalog lives in `apps/gui/src/hooks/useRemoteControl.js` (the switch statement) and `apps/backend/src/drawdb/drawdb-client.service.ts`. Read those rather than relying on a list here — they drift.

**Notes on a few non-obvious tools:**
- `export-sql` requires a specific database type. The `generic` database type returns an empty string.
- `export-dbml` / `import-dbml` work with any database type.
- `import-diagram` replaces the current diagram entirely.

### Frontend Data Model

Source of truth lives in the GUI code. The shapes you'll most commonly touch:

- **Tables** and **Fields**: `apps/gui/src/data/` and the table-related components/contexts. Fields carry standard SQL constraint flags (`primary`, `unique`, `notNull`, `increment`, `default`, `comment`).
- **Relationships**: `cardinality` is one of `one_to_one`, `one_to_many`, `many_to_one`, plus `update`/`delete` constraints.
- **Areas / Notes**: positional with `x`, `y`, `width`, `height`. Notes use Lexical editor state for `content`.
- **Enums / Types**: PostgreSQL-only entities.

### Adding a New MCP Tool

1. Create `apps/backend/src/mcp/primitives/essential/tools/your-tool.tool.ts`
2. Implement using `@McpTool()` decorator + Zod schema
3. Call `this.drawdbClient.sendCommand()` to execute the frontend command
4. Export from `apps/backend/src/mcp/primitives/essential/index.ts`
5. Add to `MCP_PRIMITIVES` array in the same file
6. If the command is new (not just a new tool wrapping an existing command), add a handler in `apps/gui/src/hooks/useRemoteControl.js` and any relevant context

### Environment Variables

**GUI:**

- `VITE_REMOTE_CONTROL_ENABLED` - Enable WebSocket connection to backend (auto-set in Docker)
- `VITE_REMOTE_CONTROL_WS` - Override WebSocket URL. If unset, the URL is derived from `window.location`

**Backend:**

- `PORT` - HTTP server port (default: 3000)
- `HOST` - HTTP server host (default: 127.0.0.1)
- `MCP_SERVER_NAME` - MCP server name (default: drawdb-mcp-server-dev)
- `MCP_SERVER_VERSION` - MCP server version (default: from package.json)
- `LOG_LEVEL` - Logger level (default: info)

**CLI Arguments** (HTTP mode only):

```bash
node dist/main-http.js --port 3000 --host 127.0.0.1
```

`--port` and `--host` override their respective env vars.

### Testing WebSocket Communication

1. `pnpm backend:dev`
2. `pnpm gui:dev`
3. Open browser, check for "DrawDB client connected" in backend logs
4. Use MCP Inspector: `pnpm backend:inspector` (STDIO mode)

For step-through debugging: `npm run inspector:stdio:debug` in `apps/backend`, then attach IDE debugger to port 9229. The debug-mode inspector pauses at startup waiting for attachment.

### Common Gotchas

- **WebSocket connection fails**: Check `VITE_REMOTE_CONTROL_ENABLED=true` and that the backend is running.
- **MCP tools timeout**: Default is 30s (`DrawDBClientService:15`).
- **Multiple tabs/windows**: Only one GUI can be connected at a time. Opening a new tab disconnects the previous one with "connection taken over by another tab/window". Close the new tab or refresh the old one to reconnect.
- **After updating versions**: hard refresh (Ctrl+Shift+R / Cmd+Shift+R) to clear cached frontend JS. Without it, the browser runs old code against a new backend and breaks in confusing ways.
- **Docker nginx**: runs as non-root user `nodejs:nodejs`, requires proper permissions on mounted volumes.
- **Build failures**: `pnpm clean && pnpm install` to reset.
- **Turborepo cache issues**: delete `.turbo/`.
- **Entity IDs**: Tables/fields/relationships/enums/types use `nanoid()` string IDs (enums/types since the port of upstream #710/#713; legacy diagrams get IDs back-filled on load/import via `apps/gui/src/utils/ensureIds.js`). Areas/notes still use numeric array indices (0, 1, 2...) reassigned on every change (`.map((t, i) => ({ ...t, id: i }))`); their MCP handlers still do `parseInt(params.id, 10)`. Enum/type MCP handlers look up by string ID (`e.id === params.id`) - never parseInt those. `updateType`/`deleteType` in `TypesContext` keep a dual-mode shim (numeric = index, string = id) because `TypeField.jsx` still passes indices, same as upstream. The areas/notes index model remains the most common source of "ID not found" bugs.
- **Command ID format**: Backend generates `cmd_${timestamp}_${random}` for request/response matching.

## Documentation

Additional docs in `docs/`:
- `CONTRIBUTING.md` - Contribution guide
- `DOCKER_BUILD.md` - Detailed Docker build instructions
- `GHCR_DEPLOYMENT.md` - GHCR tags and deployment options
- `REMOTE_CONTROL.md` - WebSocket protocol and remote control details

## CI/CD and Deployment

### GitHub Actions

**Docker Image Publishing** (`.github/workflows/docker-publish.yml`):

- Triggers on version tags (`v*`)
- Builds multi-platform images (linux/amd64, linux/arm64)
- Publishes to `ghcr.io/anatoly314/drawdb-mcp`
- Creates tags: `latest`, `vX.Y.Z`, `vX.Y`, `vX`

**Release Process:**

1. Update version in `apps/backend/package.json`
2. Commit changes
3. Create git tag: `git tag -a v1.x.y -m "Release message"`
4. Push tag: `git push origin v1.x.y`
5. GitHub Actions builds and publishes the image

### Version Management

Versions live in their respective `package.json` files — read them rather than embedding numbers here:

- Backend: `apps/backend/package.json`
- GUI: `apps/gui/package.json`
- Workspace root: `package.json`

Backend is the version that ships in Docker images and gets tagged.

## Git Workflow

- Main branch: `main`
- Notable historical commits:
  - `768d638` - Converted to Turborepo monorepo with MCP server
  - `666ece2` - Merged upstream drawdb-io/drawdb main branch
  - `32e7811` - Enforced single active GUI connection with race condition handling
  - `a9bde62` - Added persistent AI connection indicator and WebSocket heartbeat
