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
- `pnpm-workspace.yaml` - Defines apps/* workspaces
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
  - `TablesContext`, `AreasContext`, `NotesContext`, `EnumsContext`, `TypesContext` - Entity management
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
- Commands are handled by contexts, responses sent back to backend

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
- `getDiagram()` - Get full diagram state
- `addTable()`, `updateTable()`, `deleteTable()` - Table operations
- `addField()`, `updateField()`, `deleteField()` - Field operations
- `addRelationship()`, `updateRelationship()`, `deleteRelationship()` - Relationship operations
- `addArea()`, `updateArea()`, `deleteArea()` - Area (grouping) operations
- `addNote()`, `updateNote()`, `deleteNote()` - Note operations
- `getTables()`, `getTable()`, `getRelationships()` - Query operations
- `setDatabase()` - Set database type (MySQL, PostgreSQL, SQLite, etc.)
- `importDiagram()` - Import complete diagram JSON

See `apps/backend/src/drawdb/drawdb-client.service.ts` for full command list.

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

### Environment Variables

**GUI:**
- `VITE_REMOTE_CONTROL_ENABLED` - Enable WebSocket connection to backend (set automatically in Docker)

**Backend:**
- `PORT` - HTTP server port (default: 3000)
- `HOST` - HTTP server host (default: 127.0.0.1)
- `MCP_SERVER_NAME` - MCP server name (default: drawdb-mcp-server)
- `MCP_SERVER_VERSION` - MCP server version (default: 0.1.0)
- `LOG_LEVEL` - Logger level (default: info)

## Development Tips

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
4. Use MCP Inspector to test tools: `pnpm backend:inspector` (requires separate STDIO mode)

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
- **MCP tools timeout**: Default timeout is 30s (configured in `DrawDBClientService`)
- **Docker nginx issues**: Nginx runs as non-root user `nodejs:nodejs`, requires proper permissions
- **Build failures**: Run `pnpm clean` then `pnpm install` to reset
- **Turborepo cache issues**: Delete `.turbo` directory to clear cache

## Git Workflow

- Main branch: `main`
- Recent major changes:
  - `768d638` - Converted to Turborepo monorepo with MCP server
  - `cef2d67` - Added GHCR support and CI/CD
  - `db9950e` - Restructured README to Docker-first approach
