# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DrawDB is a database entity relationship diagram editor with AI integration via Model Context Protocol (MCP). It's a Turborepo monorepo containing:

- **apps/gui**: React-based frontend (original DrawDB UI)
- **apps/backend**: NestJS MCP server that enables AI assistants to create/modify diagrams programmatically
- **packages/remote-control-contract**: shared ORPC contract (`@drawdb-mcp/remote-control-contract`) defining the remote-control wire protocol both apps depend on

The backend runs an ORPC WebSocket server (the `@orpc-ws/*` library family) at `/remote-control` that the frontend connects to for real-time diagram manipulation. AI assistants like Claude can control the diagram editor through MCP tools over HTTP.

**Tests:** There are **no unit tests** in `apps/gui` or `apps/backend` — don't look for `npm test` inside the apps. There **is** an end-to-end suite (added in v1.3.0) at `tests/e2e/` (Jest, package `@drawdb-mcp/e2e`) with 9 specs that drive the MCP tools against a fully-running Docker stack: `tables`, `fields`, `relationships`, `areas`, `notes`, `enums`, `types`, `diagram`, `export-import`.

Run it against a locally-built image:

```bash
docker build -t drawdb-mcp:local .
DRAWDB_E2E_IMAGE=drawdb-mcp:local pnpm test:e2e:ci   # or pnpm test:e2e
```

It needs the Docker image and Playwright chromium (`pnpm --filter @drawdb-mcp/e2e exec playwright install chromium --with-deps`). CI (`.github/workflows/e2e.yml`) builds `drawdb-mcp:e2e-<sha>` and runs `pnpm test:e2e:ci`. The e2e suite is the real acceptance gate for any change touching the MCP layer or entity contexts — build/lint/type-check alone miss MCP-layer runtime failures. For quick spot-checks, exercise the apps through the MCP Inspector or the GUI.

## Essential Commands

### Prerequisites

- Node.js **`^20.19.0 || >=22.22.0`** (the `engines` field in root and backend `package.json`; the floor comes from `require()`-of-ESM support)
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
pnpm backend:inspector      # Launch MCP Inspector (HTTP mode; backend must already be running)
```

**Backend-specific commands** (run from `apps/backend/`):

```bash
npm run type-check             # tsc --noEmit
npm run inspector:http         # Run MCP inspector against the running HTTP server
npm run start:debug:http       # HTTP mode with debugger on port 9229
```

### Docker

**Run from GHCR:**

```bash
docker run --name drawdb-mcp -p 8080:80 -p 3000:3000 ghcr.io/anatoly-lab/drawdb-mcp:latest
# GUI: http://localhost:8080
# Remote-control WebSocket: ws://localhost:3000/remote-control
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
- `pnpm-workspace.yaml` - Defines `apps/*`, `packages/*`, and `tests/e2e` workspaces
- `turbo.json` - Turborepo pipeline configuration
- `apps/*/package.json` - Individual app dependencies and versions
- `packages/remote-control-contract/` - Shared ORPC contract package (tshy dual ESM/CJS build); both apps depend on it via `workspace:*`

**Build pipeline:**

- Turborepo handles parallel builds, caching, and task orchestration
- `turbo run build` builds the contract package and both apps in dependency order
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
- `src/hooks/` - Custom React hooks
- `src/remote-control/` - Remote-control integration (ORPC WebSocket client + command handlers)
- `src/pages/` - Route pages (Editor, LandingPage, Templates)
- `src/data/` - Data utilities and converters
- `src/utils/` - Helper functions

**Remote Control Integration:**

- Frontend connects to the backend's ORPC WebSocket at `/remote-control` using `@orpc-ws/react`
- Enabled when `VITE_REMOTE_CONTROL_ENABLED=true` (automatically set in Docker builds); `Workspace.jsx` then mounts `src/remote-control/RemoteControl.jsx`, which renders the library's `<OrpcWs>` component (client lifecycle: connect on mount, dispose on unmount)
- WebSocket URL resolution (`src/remote-control/ws.js`):
  - Uses `VITE_REMOTE_CONTROL_WS` env var if set (direct dev sets `ws://localhost:3000/remote-control` in `apps/gui/.env`, since the Vite dev server on `:5173` doesn't proxy the WebSocket)
  - Otherwise auto-detects from `window.location` — `ws://` (or `wss://` over HTTPS), same host, path `/remote-control`. Works wherever GUI and backend share a host, e.g. Docker behind nginx (`localhost:8080`)
- **Single Active Connection**: library default in authless mode. Only one GUI can control the diagram at a time; a new GUI connection kicks the previous one with close code **4005**, which moves the old client into the terminal `kicked` state (no further reconnects) and shows "AI Assistant disconnected - connection taken over by another tab/window"
- Commands are server→client ORPC procedures. `RemoteControlHandlers.jsx` composes nine per-entity handler hooks (`src/remote-control/handlers/use*Handlers.js`), each registering procedure implementations via `useServerHandler` (from `createServerHandlerHook`) that call the entity contexts (`DiagramContext`, `AreasContext`, `NotesContext`, etc.)
- Reconnection: library-managed (partysocket) exponential backoff from ~1s up to 30s, retries forever — there is no max-attempt cap. The only terminal state is `kicked`
- Command timeout: 30 seconds per call, enforced by an `AbortController` in the backend's `DrawDBClientService`
- Heartbeat: library-provided (server-driven, ~25s interval) — the GUI no longer sends its own pings

### Backend (apps/backend)

**Stack:**

- NestJS framework
- `@rekog/mcp-nest` - MCP server implementation
- `@orpc-ws/server-nestjs` - ORPC WebSocket server for the frontend connection
- Pino logger for structured logging

**Architecture:**

- **Entry Points:**
  - `src/main-http.ts` - HTTP mode (the only transport). Calls `app.enableShutdownHooks()` so the ORPC WS server can close GUI connections cleanly on shutdown
  - `bin/drawdb-mcp.js` - CLI wrapper (requires `dist/main-http`)
- **Core Modules:**
  - `src/app.module.ts` - Static root module (no more `forHttp()`/`forStdio()` factories). Registers `McpModule` (Streamable HTTP at `/`) and `OrpcWsModule.forRoot({ mode: "authless", ... , connection: { path: "/remote-control" } })`
  - `src/drawdb/` - DrawDB integration module
    - `drawdb-client.service.ts` - Facade over the typed ORPC server→client caller (`conn.client` for the single authless connection); exposes `isConnected()`, `sendCommand()`, and typed per-command wrappers
    - `drawdb.types.ts` - Thin re-export shim over `@drawdb-mcp/remote-control-contract` types
- **MCP Primitives:**
  - `src/mcp/primitives/essential/tools/*.tool.ts` - Individual MCP tools. To see the full set, list this directory — it's authoritative
  - `src/mcp/primitives/essential/index.ts` - Module exports with `McpPrimitivesDrawDBModule.forRoot()` and the `MCP_PRIMITIVES` registration array

**Transport:**

- **HTTP only**: NestJS HTTP server. MCP endpoint (Streamable HTTP) at root `/`, frontend ORPC WebSocket at `/remote-control`. Default `http://127.0.0.1:3000`. Logger writes to stdout.
- STDIO mode was **removed** (it never had a WebSocket attached, so every tool call failed). There is no `main-stdio.ts` and no `*:stdio` scripts.

**Remote-Control Call Flow:**

1. Frontend connects to `ws://localhost:3000/remote-control`; `OrpcWsModule` (authless mode) accepts the upgrade
2. The GUI hosts the `clientContract` procedures; the backend holds a typed server→client caller for the single authless connection (`SINGLE_AUTHLESS_KEY`)
3. MCP tools call `DrawDBClientService` — either a typed wrapper (`addTable(...)`) or `sendCommand(command, params)` for dynamic dispatch by wire-command name
4. The service invokes the ORPC procedure with a per-call `AbortController` timeout (30s, "Command X timed out after 30000ms")
5. The matching GUI handler hook executes the command against the entity contexts
6. Success = promise resolution with the result data; failure = thrown ORPC error (there is no `{success, error}` envelope anymore)

### Remote-Control Contract (packages/remote-control-contract)

`@drawdb-mcp/remote-control-contract` is the single source of truth for the wire protocol:

- `src/index.ts` - `clientContract`: a **flat** ORPC router of 28 server→client procedures (flatness is required by the client-hosted-router mode; the procedure key IS the wire command name). Composed by spreading per-feature fragments from `src/client/*.contract.ts`
- `src/schemas.ts` - Zod entity schemas + inferred TS types shared by both sides
- Built with **tshy** (dual ESM/CJS) — run `pnpm build` after changing it so both apps pick up the new contract
- Six legacy read commands were deliberately dropped (nothing ever sent them): `getTables`, `getRelationships`, `getAreas`, `getNotes`, `getEnums`, `getTypes`

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

Each tool is an injectable NestJS service with a method decorated with `@Tool()` (from `@rekog/mcp-nest`), validates input with a Zod schema, and calls `DrawDBClientService` (typed wrapper or `sendCommand()`) to execute a frontend command. See `apps/backend/src/mcp/primitives/essential/tools/add-table.tool.ts` for the canonical example.

**Tool catalog** is defined by the directory `apps/backend/src/mcp/primitives/essential/tools/` (one file per tool). The **wire-command catalog** is the `clientContract` in `packages/remote-control-contract/src/index.ts`; the frontend implementations live in `apps/gui/src/remote-control/handlers/`. Read those rather than relying on a list here — they drift.

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

1. If the wire command is new (not just a new tool wrapping an existing command):
   - Add the procedure to the matching feature fragment in `packages/remote-control-contract/src/client/*.contract.ts` (or a new fragment spread into `clientContract` in `src/index.ts` — the contract must stay flat)
   - Rebuild the contract package (`pnpm build --filter=@drawdb-mcp/remote-control-contract`, or just `pnpm build`)
   - Implement the handler in the matching `apps/gui/src/remote-control/handlers/use*Handlers.js` hook via `useServerHandler("yourCommand", ...)`, calling the relevant entity context
   - Optionally add a typed wrapper in `apps/backend/src/drawdb/drawdb-client.service.ts` (enum/type tools show that plain `sendCommand()` also works)
2. Create `apps/backend/src/mcp/primitives/essential/tools/your-tool.tool.ts`
3. Implement using the `@Tool()` decorator + Zod schema, calling `DrawDBClientService`
4. Export from `apps/backend/src/mcp/primitives/essential/index.ts`
5. Add to the `MCP_PRIMITIVES` array in the same file

### Environment Variables

**GUI:**

- `VITE_REMOTE_CONTROL_ENABLED` - Enable WebSocket connection to backend (auto-set in Docker)
- `VITE_REMOTE_CONTROL_WS` - Override WebSocket URL. If unset, the URL is derived from `window.location`
- `VITE_MCP_URL` - MCP endpoint URL shown in the header tag. If unset, derived from `VITE_REMOTE_CONTROL_WS` (same origin, http scheme); if neither is set the tag is hidden (no guessing of Docker port mappings)

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
3. Open the browser — the GUI shows an "AI Assistant connected" toast and ControlPanel's "AI Connected" indicator turns on
4. Use MCP Inspector: `pnpm backend:inspector` (HTTP mode — it connects to the already-running backend at `http://127.0.0.1:3000/`, per `apps/backend/mcp-inspector-config.json`)

For step-through debugging: `npm run start:debug:http` in `apps/backend`, then attach IDE debugger to port 9229 and point the inspector/GUI at it as usual.

### Common Gotchas

- **WebSocket connection fails**: Check `VITE_REMOTE_CONTROL_ENABLED=true` and that the backend is running.
- **MCP tools timeout**: 30s per call (`requestTimeout` in `DrawDBClientService`), enforced with an `AbortController` — "Command X timed out after 30000ms".
- **Multiple tabs/windows**: Only one GUI can be connected at a time (authless-mode default). Opening a new tab kicks the previous one (close code 4005) into a terminal `kicked` state — it will NOT auto-reconnect — with the toast "connection taken over by another tab/window". Close the new tab and refresh the old one to reconnect.
- **After updating versions**: hard refresh (Ctrl+Shift+R / Cmd+Shift+R) to clear cached frontend JS. Without it, the browser runs old code against a new backend and breaks in confusing ways.
- **Docker nginx**: runs as non-root user `nodejs:nodejs`, requires proper permissions on mounted volumes.
- **Build failures**: `pnpm clean && pnpm install` to reset.
- **Turborepo cache issues**: delete `.turbo/`.
- **Entity IDs**: Tables/fields/relationships/enums/types use `nanoid()` string IDs (enums/types since the port of upstream #710/#713; legacy diagrams get IDs back-filled on load/import via `apps/gui/src/utils/ensureIds.js`). Areas/notes still use numeric array indices (0, 1, 2...) reassigned on every change (`.map((t, i) => ({ ...t, id: i }))`); their MCP handlers still do `parseInt(params.id, 10)`. Enum/type MCP handlers look up by string ID (`e.id === params.id`) - never parseInt those. `updateType`/`deleteType` in `TypesContext` keep a dual-mode shim (numeric = index, string = id) because `TypeField.jsx` still passes indices, same as upstream. The areas/notes index model remains the most common source of "ID not found" bugs.
- **Error model**: commands don't return a `{success, error}` envelope — a failed command is a thrown/rejected ORPC error; request/response correlation is handled by the ORPC transport (no hand-rolled command IDs).

## Documentation

Additional docs in `docs/`:

- `CONTRIBUTING.md` - Contribution guide
- `DOCKER_BUILD.md` - Detailed Docker build instructions
- `GHCR_DEPLOYMENT.md` - GHCR tags and deployment options
- `REMOTE_CONTROL.md` - Remote-control protocol (ORPC over WebSocket) and integration details

## CI/CD and Deployment

### GitHub Actions

**Docker Image Publishing** (`.github/workflows/docker-publish.yml`):

- Triggers on version tags (`v*`)
- Builds multi-platform images (linux/amd64, linux/arm64)
- Publishes to `ghcr.io/anatoly-lab/drawdb-mcp`
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
