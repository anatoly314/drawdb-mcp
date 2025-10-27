# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DrawDB is a database entity relationship diagram editor with AI integration via Model Context Protocol (MCP). It's a Turborepo monorepo containing:

- **apps/gui**: React-based frontend (original DrawDB UI)
- **apps/backend**: NestJS MCP server that enables AI assistants to create/modify diagrams programmatically

The backend runs a WebSocket server that the frontend connects to for real-time diagram manipulation. AI assistants like Claude can control the diagram editor through MCP tools over HTTP.

## Essential Commands

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

**Build:**

```bash
pnpm build                  # Build both apps
pnpm build --filter=gui     # Build GUI only
pnpm build --filter=backend # Build backend only
```

**Other:**

```bash
pnpm lint           # Run linters for all apps
pnpm format         # Format all code with Prettier
pnpm clean          # Clean all build artifacts and node_modules
pnpm backend:inspector  # Launch MCP Inspector for testing tools (STDIO mode)
```

**Backend-specific commands** (when working in apps/backend):

```bash
npm run inspector:stdio        # Run MCP inspector for STDIO mode
npm run inspector:stdio:debug  # Run STDIO inspector with debugger on port 9229
npm run inspector:http         # Run MCP inspector for HTTP mode
npm run start:debug:stdio      # STDIO mode with debugger
npm run start:debug:http       # HTTP mode with debugger
```

### Docker

**Run from GHCR:**

```bash
docker run --name drawdb -p 8080:80 -p 3000:3000 ghcr.io/anatoly314/drawdb:latest
# GUI: http://localhost:8080
# MCP WebSocket: ws://localhost:3000/remote-control
```

**Build locally:**

```bash
docker-compose up --build    # Use docker-compose.yml
# OR
docker build -t drawdb:local .
docker run -p 8080:80 -p 3000:3000 drawdb:local
```

### Connect Claude Code to MCP Server

When backend is running locally:

```bash
claude mcp add --transport http drawdb-mcp http://127.0.0.1:3000
```

## Architecture

### Monorepo Structure

This is a **pnpm workspaces + Turborepo** monorepo (converted from standalone app in commit `768d638`).

**Key files:**

- `package.json` - Root package with workspace scripts
- `pnpm-workspace.yaml` - Defines apps/\* workspaces
- `turbo.json` - Turborepo pipeline configuration
- `apps/*/package.json` - Individual app dependencies

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

- React Context API with multiple specialized contexts:
  - `DiagramContext` - Main diagram state (tables, relationships)
  - `AreasContext`, `NotesContext`, `EnumsContext`, `TypesContext` - Entity management
  - `CanvasContext` - Canvas rendering and interactions
  - `UndoRedoContext` - Undo/redo history
  - `SettingsContext` - User preferences
  - `SaveStateContext` - Save/load state
  - `TransformContext` - Zoom/pan transformations
  - `SelectContext` - Selection state

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
- WebSocket auto-detects URL from browser (supports both direct access and nginx proxy)
  - Auto-detection: `ws://localhost:5173/remote-control` (dev) or `ws://localhost:8080/remote-control` (Docker)
  - Protocol switches to `wss://` for HTTPS connections
- **Single Active Connection**: Only one GUI can control the diagram at a time
  - When a new GUI connects, the previous connection is gracefully closed
  - Old GUI shows "AI Assistant disconnected - connection taken over by another tab/window"
  - Prevents confusion from multiple tabs trying to control the same backend
- Commands are handled by contexts (`DiagramContext`, `AreasContext`, `NotesContext`, etc.)
- Automatic reconnection with exponential backoff (max 10 attempts, up to 30s delay with jitter)
  - Exception: Won't reconnect if connection was replaced by another session
- Connection status displayed via Toast notifications and persistent status badge
- All commands processed through `useRemoteControl.js:152` switch statement
- Command timeout: 30 seconds (configured in `DrawDBClientService:15`)
- Heartbeat: Frontend sends ping every 30 seconds to keep connection alive

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
    - `drawdb-client.service.ts` - Service for sending commands to frontend via WebSocket
    - `drawdb.types.ts` - TypeScript types for commands/responses
- **MCP Primitives:**
  - `src/mcp/primitives/essential/` - MCP tools, prompts, resources
    - `tools/*.tool.ts` - Individual MCP tools (add-table, get-diagram, etc.)
    - `index.ts` - Module exports with `McpPrimitivesDrawDBModule.forRoot()`

**Transport Modes:**

- **HTTP Mode** (production):
  - NestJS HTTP server with WebSocket support
  - MCP endpoint at root `/`
  - Frontend WebSocket at `/remote-control`
  - Default: `http://127.0.0.1:3000`
  - Logger writes to stdout
- **STDIO Mode** (development/testing):
  - Standard input/output for MCP protocol
  - No HTTP server
  - Logger writes to stderr

**WebSocket Flow:**

1. Frontend connects to `ws://localhost:3000/remote-control`
2. `DrawDBGateway` accepts connection, passes to `DrawDBClientService`
3. MCP tools call `DrawDBClientService.sendCommand()` with command name + params
4. Service sends JSON message over WebSocket, waits for response (30s timeout)
5. Frontend processes command in appropriate context, sends result back
6. Service resolves promise with result data

### Docker Deployment

**Multi-stage build:**

1. **Stage 1 (build)**: Build both apps with Turborepo
2. **Stage 2 (production)**: Nginx + Node.js + backend + frontend
   - Nginx serves frontend from `/usr/share/nginx/html`
   - Nginx proxies `/api/` and `/remote-control` to backend on port 3000
   - Backend runs Node.js MCP server on port 3000
   - Both processes started by `docker/start.sh` using dumb-init

**Files:**

- `Dockerfile` - Multi-stage build (node:20-alpine)
- `docker-compose.yml` - Compose configuration
- `docker/nginx.conf` - Nginx config with WebSocket proxy
- `docker/start.sh` - Entrypoint script that starts nginx + backend

**Ports:**

- **80**: Nginx (GUI + proxied backend)
- **3000**: Backend (MCP HTTP + WebSocket)

## Key Implementation Details

### MCP Tool Pattern

Each tool follows this structure:

1. Injectable NestJS service decorated with MCP metadata
2. Calls `DrawDBClientService.sendCommand()` to execute frontend command
3. Returns result to MCP client (Claude)

Example: `apps/backend/src/mcp/primitives/essential/tools/add-table.tool.ts`

**Available Commands:**

- `getDiagram()` - Get full diagram state (all entities)
- `addTable()`, `updateTable()`, `deleteTable()` - Table operations
- `addField()`, `updateField()`, `deleteField()` - Field operations
- `addRelationship()`, `updateRelationship()`, `deleteRelationship()` - Relationship operations
- `addArea()`, `updateArea()`, `deleteArea()` - Area (grouping) operations
- `addNote()`, `updateNote()`, `deleteNote()` - Note operations
- `addEnum()`, `updateEnum()`, `deleteEnum()` - PostgreSQL ENUM type operations
- `addType()`, `updateType()`, `deleteType()` - PostgreSQL composite type operations
- `getTables()`, `getTable()`, `getRelationships()`, `getAreas()`, `getNotes()`, `getEnums()`, `getTypes()` - Query operations (read-only)
- `setDatabase()` - Set database type (MySQL, PostgreSQL, SQLite, MSSQL, MariaDB)
- `importDiagram()` - Import complete diagram JSON (replaces current diagram)
- `exportDiagram()` - Export diagram to SQL, JSON, or other formats (available via MCP tool)

See `apps/backend/src/drawdb/drawdb-client.service.ts` and `apps/gui/src/hooks/useRemoteControl.js` for full command list.

### Frontend Data Model

**Tables:**

- `id`, `name`, `x`, `y`, `color`, `comment`
- `fields[]` - Array of field objects
- `indices[]` - Array of index definitions

**Fields:**

- `id`, `name`, `type`, `primary`, `unique`, `notNull`, `increment`, `default`, `comment`

**Relationships:**

- `id`, `name`, `cardinality` (One to one, One to many, Many to one)
- `startTableId`, `endTableId`
- `startFieldId`, `endFieldId`
- `updateConstraint`, `deleteConstraint`

**Areas:**

- `id`, `name`, `x`, `y`, `width`, `height`, `color`

**Notes:**

- `id`, `title`, `content` (Lexical editor state), `x`, `y`, `width`, `height`

**Enums (PostgreSQL):**

- `id`, `name`, `values[]` - Array of allowed enum values

**Types (PostgreSQL):**

- `id`, `name`, `fields[]` - Array of field objects with `name` and `type`
- `comment` - Optional description

### Environment Variables

**GUI:**

- `VITE_REMOTE_CONTROL_ENABLED` - Enable WebSocket connection to backend (set automatically in Docker)

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

- `--port <number>` - Override PORT environment variable
- `--host <string>` - Override HOST environment variable

## Development Tips

### Available MCP Tools

The backend exposes the following MCP tools (located in `apps/backend/src/mcp/primitives/essential/tools/`):

**Table Tools:**
- `add-table` - Create new table with fields
- `update-table` - Modify table properties (name, color, position, comment)
- `delete-table` - Remove table from diagram
- `get-table` - Retrieve single table by ID or name

**Field Tools:**
- `add-field` - Add field to existing table
- `update-field` - Modify field properties (type, constraints, etc.)
- `delete-field` - Remove field from table

**Relationship Tools:**
- `add-relationship` - Create relationship between tables
- `update-relationship` - Modify relationship properties
- `delete-relationship` - Remove relationship

**Area Tools:**
- `add-area` - Create grouping area for tables
- `update-area` - Modify area properties (name, size, color, position)
- `delete-area` - Remove area

**Note Tools:**
- `add-note` - Create text note with Lexical editor content
- `update-note` - Modify note content or properties
- `delete-note` - Remove note

**PostgreSQL Type Tools:**
- `add-enum` - Create ENUM type with values
- `update-enum` - Modify ENUM values
- `delete-enum` - Remove ENUM type
- `add-type` - Create composite type with fields
- `update-type` - Modify composite type
- `delete-type` - Remove composite type

**Diagram Tools:**
- `get-diagram` - Retrieve entire diagram state (all entities)
- `import-diagram` - Replace diagram with JSON data
- `export-diagram` - Export to SQL, JSON, or other formats

Each tool validates input using Zod schemas and communicates with the frontend via WebSocket.

### Adding a New MCP Tool

1. Create `apps/backend/src/mcp/primitives/essential/tools/your-tool.tool.ts`
2. Implement tool using `@McpTool()` decorator and Zod schema
3. Call `this.drawdbClient.sendCommand()` to execute frontend command
4. Export from `apps/backend/src/mcp/primitives/essential/index.ts`
5. Add to `MCP_PRIMITIVES` array in same file

### Testing WebSocket Communication

1. Start backend: `pnpm backend:dev`
2. Start frontend: `pnpm gui:dev`
3. Open browser console, check for "DrawDB client connected" in backend logs
4. Use MCP Inspector to test tools: `pnpm backend:inspector` (STDIO mode)

**For debugging with breakpoints:**

1. Run `npm run inspector:stdio:debug` in `apps/backend` directory
2. Attach your IDE debugger to port 9229
3. Inspector pauses at startup waiting for debugger attachment

### Debugging Docker Build

```bash
# Build specific stage
docker build --target build -t drawdb:build .

# Run with logs
docker run -p 8080:80 -p 3000:3000 drawdb:local
# Check logs: docker logs drawdb
```

### Frontend Context Access

To access diagram state in new components:

```jsx
import { useContext } from 'react';
import { DiagramContext } from '../context/DiagramContext';

function MyComponent() {
  const { tables, addTable } = useContext(DiagramContext);
  // ...
}
```

### Common Gotchas

- **WebSocket connection fails**: Check that `VITE_REMOTE_CONTROL_ENABLED=true` and backend is running
- **MCP tools timeout**: Default timeout is 30s (configured in `DrawDBClientService:15`)
- **Multiple tabs/windows**: Only one GUI can be connected at a time. Opening a new tab will disconnect the previous one with message "connection taken over by another tab/window"
- **Connection replaced**: If you see "connection taken over", another tab/window is now active. Close it or refresh this tab to reconnect
- **After updating versions**: **MUST perform hard refresh** (Ctrl+Shift+R / Cmd+Shift+R) to clear cached frontend JavaScript. Without hard refresh, browser may use old cached code even with new backend, causing errors
- **Docker nginx issues**: Nginx runs as non-root user `nodejs:nodejs`, requires proper permissions
- **Build failures**: Run `pnpm clean` then `pnpm install` to reset
- **Turborepo cache issues**: Delete `.turbo` directory to clear cache
- **Area/Note IDs**: Areas and notes use numeric array indices (0, 1, 2...) as IDs, unlike tables which use `nanoid()`. IDs are reassigned on every change via `.map((t, i) => ({ ...t, id: i }))`. MCP tools now return these numeric IDs correctly from `addArea`/`addNote` responses. Update/delete operations convert string IDs to integers for lookup (`parseInt(params.id, 10)`)
- **Entity IDs**: All entities (tables, fields, relationships, enums, types) use `nanoid()` for unique ID generation (imported from `nanoid` package)
- **Remote control enabled check**: Frontend checks `import.meta.env.VITE_REMOTE_CONTROL_ENABLED` to enable WebSocket connection (see `useRemoteControl.js:34`)
- **Command ID format**: Backend generates unique command IDs using `cmd_${timestamp}_${random}` pattern for request/response matching

## CI/CD and Deployment

### GitHub Actions

**Docker Image Publishing** (`.github/workflows/docker-publish.yml`):

- Triggers on version tags (`v*`)
- Builds multi-platform images (linux/amd64, linux/arm64)
- Publishes to GitHub Container Registry (ghcr.io)
- Creates tags: `latest`, `vX.Y.Z`, `vX.Y`, `vX`

**Release Process:**

1. Update version in `apps/backend/package.json`
2. Commit changes
3. Create git tag: `git tag -a v1.1.2 -m "Release message"`
4. Push tag: `git push origin v1.1.2`
5. GitHub Actions automatically builds and publishes Docker image

### Version Management

- Backend version: `apps/backend/package.json` (currently 1.1.6)
- GUI version: `apps/gui/package.json` (currently 1.0.0)
- Root package: `package.json` (workspace root, 1.0.0)

## Git Workflow

- Main branch: `main`
- Recent major changes:
  - `768d638` - Converted to Turborepo monorepo with MCP server
  - `666ece2` - Merged upstream drawdb-io/drawdb main branch
  - `32e7811` - Enforced single active GUI connection with race condition handling
  - `a9bde62` - Added persistent AI connection indicator and WebSocket heartbeat
