# Remote Control API for AI/LLM Integration

This document describes how the DrawDB editor is remote-controlled over WebSocket for AI-assisted diagram generation, and how to extend the protocol.

## Architecture

```
AI Assistant (MCP client)
    ↓ MCP over HTTP
NestJS backend (apps/backend)
    ↓ ORPC over WebSocket (/remote-control, server → client calls)
GUI handler hooks (apps/gui/src/remote-control/handlers/)
    ↓
Entity contexts (DiagramContext, AreasContext, NotesContext, ...)
```

The transport is the [`@orpc-ws/*`](https://www.npmjs.com/org/orpc-ws) library family (v0.9.0), not a hand-rolled JSON protocol:

- The backend registers `OrpcWsModule.forRoot(...)` (from `@orpc-ws/server-nestjs`) in **authless** mode with the WebSocket path `/remote-control`.
- The direction is **server → client**: the browser (GUI) hosts the procedures, and the backend invokes them through a typed caller (`conn.client`), exactly like a client calling a server router — just inverted.
- The shared package `@drawdb-mcp/remote-control-contract` (`packages/remote-control-contract`) is the single source of truth for the wire shape: a **flat** ORPC `clientContract` of 28 procedures (the procedure key is the wire command name) plus the zod entity schemas both sides validate against.
- The GUI mounts `apps/gui/src/remote-control/RemoteControl.jsx`, which renders the library's `<OrpcWs>` component and registers one handler per procedure via `useServerHandler` (see `apps/gui/src/remote-control/handlers/`).

Message framing, request/response correlation, heartbeat, and reconnect are all owned by the library — there are no raw wire frames to construct by hand.

## Setup

1. **Enable remote control** in the GUI's `.env`:

```bash
VITE_REMOTE_CONTROL_ENABLED=true
# Optional override; if unset the URL is derived from window.location
# (ws:// or wss://, same host, path /remote-control)
VITE_REMOTE_CONTROL_WS=ws://localhost:3000/remote-control
# Optional: MCP endpoint URL shown in the header tag; if unset it is
# derived from VITE_REMOTE_CONTROL_WS (same origin, http scheme), and if
# neither is set the tag is hidden (the published MCP port cannot be
# guessed reliably from the browser)
VITE_MCP_URL=http://localhost:3000
```

2. **Start the backend** (`pnpm backend:dev`) — it exposes the WebSocket at `ws://127.0.0.1:3000/remote-control` and the MCP endpoint at `http://127.0.0.1:3000/`.

3. **Open the editor** — it connects automatically and shows an "AI Assistant connected" toast; ControlPanel displays a persistent "AI Connected" indicator.

## Connection Semantics

- **Authless, single active connection**: every WebSocket upgrade is accepted, but only one GUI holds the connection at a time (the library's authless-mode default). When a new GUI connects, the previous socket is closed with close code **4005** (session replaced). The old client maps this to a terminal `kicked` state — it stops reconnecting and shows "AI Assistant disconnected - connection taken over by another tab/window". Close the new tab and refresh the old one to reconnect.
- **Reconnect**: library-managed (partysocket) exponential backoff with jitter, from ~1s up to 30s, retrying indefinitely. There is no max-attempt cap; `kicked` is the only terminal state.
- **Heartbeat**: library-provided and server-driven (~25s interval). The GUI does not send application-level pings.
- **Shutdown**: the backend calls `enableShutdownHooks()` so a stopping server closes GUI connections cleanly (close code 4009) instead of dropping the TCP connection.
- **Command timeout**: 30 seconds per call, enforced on the backend by an `AbortController` in `DrawDBClientService` ("Command X timed out after 30000ms"). The abort propagates through ORPC to the GUI, cancelling the in-flight handler.

## Command Catalog

The authoritative catalog is `clientContract` in `packages/remote-control-contract/src/index.ts`, composed from per-feature fragments in `src/client/*.contract.ts`:

| Feature       | Commands                                                      |
| ------------- | ------------------------------------------------------------- |
| Tables        | `addTable`, `updateTable`, `deleteTable`, `getTable`          |
| Fields        | `addField`, `updateField`, `deleteField`                      |
| Relationships | `addRelationship`, `updateRelationship`, `deleteRelationship` |
| Areas         | `addArea`, `updateArea`, `deleteArea`                         |
| Notes         | `addNote`, `updateNote`, `deleteNote`                         |
| Enums         | `addEnum`, `updateEnum`, `deleteEnum`                         |
| Types         | `addType`, `updateType`, `deleteType`                         |
| Diagram       | `setDatabase`, `getDiagram`, `importDiagram`                  |
| Export/Import | `exportSQL`, `exportDBML`, `importDBML`                       |

Input/output shapes are defined by the zod schemas in the contract fragments and `packages/remote-control-contract/src/schemas.ts` — read those rather than a copy here.

The legacy read commands `getTables`, `getRelationships`, `getAreas`, `getNotes`, `getEnums`, and `getTypes` were dropped when the protocol moved to ORPC (the GUI handled them, but nothing ever sent them). Use `getDiagram` for full state.

Valid `setDatabase` values: `mysql`, `postgresql`, `sqlite`, `mariadb`, `mssql`, `oraclesql`, `generic`.

## Error Model

There is no `{ success, data, error }` envelope. Under ORPC:

- **Success** is promise resolution — the handler's return value is the output.
- **Failure** is a thrown error in the GUI handler, which rejects the backend's call with a typed ORPC error (e.g. a `getTable` handler throws `Table not found: ...`).

## Data Shapes

Entity schemas live in `packages/remote-control-contract/src/schemas.ts` (shared zod schemas; the backend's `drawdb.types.ts` re-exports the inferred types). The most commonly used shapes:

**Fields:**

```typescript
{
  id: string,              // Unique field ID (nanoid())
  name: string,            // Field name
  type: string,            // Data type (e.g., "INTEGER", "VARCHAR", "TEXT")
  primary: boolean,        // Is primary key
  unique: boolean,         // Has unique constraint
  notNull: boolean,        // Has NOT NULL constraint
  increment: boolean,      // Auto increment
  default: string,         // Default value
  check: string,           // Check constraint
  comment: string          // Field comment
}
```

**Cardinality** (relationships): `"one_to_one"`, `"one_to_many"`, `"many_to_one"`

**Update/delete constraints**: `"No action"`, `"Restrict"`, `"Cascade"`, `"Set null"`, `"Set default"`

## Extending the Protocol

Adding a new wire command means touching the contract, the GUI, and (usually) an MCP tool:

1. Add the procedure to its feature fragment in `packages/remote-control-contract/src/client/*.contract.ts` (or a new fragment spread into `clientContract` — the contract must stay flat; nested sub-routers are rejected at construction).
2. Rebuild the contract package (`pnpm build --filter=@drawdb-mcp/remote-control-contract`).
3. Implement the handler in the matching `apps/gui/src/remote-control/handlers/use*Handlers.js` hook via `useServerHandler("yourCommand", handler)`, delegating to the entity contexts.
4. Call it from the backend via `DrawDBClientService` — a typed wrapper method or the dynamic `sendCommand("yourCommand", params)` — and expose it as an MCP tool.

See the "Adding a New MCP Tool" recipe in the root `CLAUDE.md` for the full step-by-step, and `apps/gui/src/remote-control/handlers/useTableHandlers.js` for a canonical handler.

## Performance Notes

- Commands execute synchronously in the React state
- Undo/redo history is preserved when `addToHistory: true`
- Large batch operations should be throttled to avoid UI lag

## Security Considerations

- Only enable remote control in trusted environments — the connection is authless by design (one anonymous GUI at a time)
- The WebSocket endpoint should be secured (WSS in production); the GUI automatically uses `wss://` when served over HTTPS
- Input validation happens on both sides via the shared zod schemas in the contract package
- Rate limit commands to prevent abuse
