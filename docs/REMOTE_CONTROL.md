# Remote Control API for AI/LLM Integration

This document describes how to enable remote control of the DrawDB editor via WebSocket for AI-assisted diagram generation.

## Architecture

```
LLM/MCP Server → Your Backend → WebSocket → useRemoteControl Hook → DiagramContext
```

The frontend hook listens for commands and executes them against the existing React context methods.

## Setup

1. **Enable remote control** in your `.env`:

```bash
VITE_REMOTE_CONTROL_ENABLED=true
VITE_REMOTE_CONTROL_WS=ws://localhost:8080/remote-control
```

2. **Start your backend** WebSocket server (implementation below)

3. **Open the editor** - it will automatically connect to your WebSocket server

## WebSocket Protocol

### Message Format

All messages are JSON with this structure:

```typescript
// Client → Server (responses)
{
  id: string,           // Same ID from the command
  success: boolean,
  message?: string,     // Human-readable result
  data?: any,          // Response data (for query operations)
  error?: string       // Error message if success=false
}

// Server → Client (commands)
{
  id: string,          // Unique command ID for tracking
  command: string,     // Command name (see below)
  params: object       // Command-specific parameters
}
```

### Available Commands

#### Table Operations

**addTable**

```json
{
  "id": "cmd_123",
  "command": "addTable",
  "params": {
    "data": {
      "id": "tbl_xyz",
      "name": "users",
      "x": 100,
      "y": 100,
      "fields": [
        {
          "id": "fld_1",
          "name": "id",
          "type": "INTEGER",
          "primary": true,
          "notNull": true,
          "increment": true
        },
        {
          "id": "fld_2",
          "name": "email",
          "type": "VARCHAR",
          "notNull": true,
          "unique": true
        }
      ],
      "color": "#175e7a"
    },
    "addToHistory": true
  }
}
```

**updateTable**

```json
{
  "id": "cmd_124",
  "command": "updateTable",
  "params": {
    "id": "tbl_xyz",
    "updates": {
      "name": "customers",
      "x": 200,
      "y": 150
    }
  }
}
```

**deleteTable**

```json
{
  "id": "cmd_125",
  "command": "deleteTable",
  "params": {
    "id": "tbl_xyz",
    "addToHistory": true
  }
}
```

#### Field Operations

**addField**

```json
{
  "id": "cmd_126",
  "command": "addField",
  "params": {
    "tableId": "tbl_xyz",
    "field": {
      "id": "fld_3",
      "name": "created_at",
      "type": "TIMESTAMP",
      "default": "CURRENT_TIMESTAMP",
      "notNull": true
    }
  }
}
```

**updateField**

```json
{
  "id": "cmd_127",
  "command": "updateField",
  "params": {
    "tableId": "tbl_xyz",
    "fieldId": "fld_2",
    "updates": {
      "type": "TEXT",
      "unique": false
    }
  }
}
```

**deleteField**

```json
{
  "id": "cmd_128",
  "command": "deleteField",
  "params": {
    "tableId": "tbl_xyz",
    "fieldId": "fld_2",
    "addToHistory": true
  }
}
```

#### Relationship Operations

**addRelationship**

```json
{
  "id": "cmd_129",
  "command": "addRelationship",
  "params": {
    "data": {
      "id": "rel_1",
      "name": "fk_orders_users",
      "startTableId": "tbl_orders",
      "startFieldId": "fld_user_id",
      "endTableId": "tbl_users",
      "endFieldId": "fld_id",
      "cardinality": "many_to_one",
      "updateConstraint": "Cascade",
      "deleteConstraint": "Cascade"
    },
    "addToHistory": true
  }
}
```

**updateRelationship**

```json
{
  "id": "cmd_130",
  "command": "updateRelationship",
  "params": {
    "id": "rel_1",
    "updates": {
      "deleteConstraint": "Set null"
    }
  }
}
```

**deleteRelationship**

```json
{
  "id": "cmd_131",
  "command": "deleteRelationship",
  "params": {
    "id": "rel_1",
    "addToHistory": true
  }
}
```

#### Area Operations (Grouping)

**addArea**

```json
{
  "id": "cmd_132",
  "command": "addArea",
  "params": {
    "data": {
      "id": "area_1",
      "name": "User Management",
      "x": 50,
      "y": 50,
      "width": 400,
      "height": 300,
      "color": "#3b82f6"
    }
  }
}
```

#### Note Operations

**addNote**

```json
{
  "id": "cmd_133",
  "command": "addNote",
  "params": {
    "data": {
      "id": "note_1",
      "title": "Important",
      "content": "This is a user authentication system",
      "x": 500,
      "y": 100
    }
  }
}
```

#### Query Operations (Read-only)

**getDiagram** - Get entire diagram state

```json
{
  "id": "cmd_134",
  "command": "getDiagram",
  "params": {}
}
```

Response:

```json
{
  "id": "cmd_134",
  "success": true,
  "data": {
    "database": "postgresql",
    "tables": [...],
    "relationships": [...],
    "areas": [...],
    "notes": [...],
    "enums": [...],
    "types": [...]
  }
}
```

**getTables** - Get all tables

```json
{
  "id": "cmd_135",
  "command": "getTables",
  "params": {}
}
```

Other query commands: `getRelationships`, `getAreas`, `getNotes`, `getEnums`, `getTypes`

#### Database Settings

**setDatabase**

```json
{
  "id": "cmd_136",
  "command": "setDatabase",
  "params": {
    "database": "postgresql"
  }
}
```

Valid database values: `mysql`, `postgresql`, `sqlite`, `mariadb`, `mssql`, `oraclesql`, `generic`

## Field Data Structure

Fields must follow this structure:

```typescript
{
  id: string,              // Unique field ID (use nanoid())
  name: string,           // Field name
  type: string,           // Data type (e.g., "INTEGER", "VARCHAR", "TEXT")
  primary: boolean,       // Is primary key
  unique: boolean,        // Has unique constraint
  notNull: boolean,       // Has NOT NULL constraint
  increment: boolean,     // Auto increment
  default: string,        // Default value
  check: string,          // Check constraint
  comment: string         // Field comment
}
```

## Cardinality Values

For relationships, use these cardinality values:

- `"one_to_one"`
- `"one_to_many"`
- `"many_to_one"`

## Constraint Values

For update/delete constraints:

- `"No action"`
- `"Restrict"`
- `"Cascade"`
- `"Set null"`
- `"Set default"`

## Example Backend (Node.js)

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080, path: '/remote-control' });

wss.on('connection', (ws) => {
  console.log('DrawDB client connected');

  // Example: Create a table when client connects
  ws.send(
    JSON.stringify({
      id: 'cmd_' + Date.now(),
      command: 'addTable',
      params: {
        data: {
          id: 'tbl_' + Date.now(),
          name: 'users',
          x: 100,
          y: 100,
          fields: [
            {
              id: 'fld_1',
              name: 'id',
              type: 'INTEGER',
              primary: true,
              notNull: true,
              increment: true,
              default: '',
              check: '',
              comment: '',
            },
          ],
          color: '#175e7a',
          indices: [],
          comment: '',
        },
      },
    }),
  );

  // Listen for responses
  ws.on('message', (data) => {
    const response = JSON.parse(data);
    console.log('Response:', response);
  });
});
```

## MCP Server Integration

To integrate with an MCP server:

1. Create MCP tools that map to these commands
2. Your MCP server sends commands to your WebSocket backend
3. Your WebSocket backend forwards them to the DrawDB client
4. Responses flow back through the same path

Example MCP tool structure:

```typescript
{
  name: "drawdb_add_table",
  description: "Add a table to the database diagram",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      fields: { type: "array" },
      x: { type: "number" },
      y: { type: "number" }
    }
  }
}
```

## Error Handling

All commands return success/failure responses. Handle errors appropriately:

```json
{
  "id": "cmd_123",
  "success": false,
  "error": "Table tbl_xyz not found"
}
```

## Performance Notes

- Commands execute synchronously in the React state
- Multiple commands can be batched by sending them rapidly
- Undo/redo history is preserved when `addToHistory: true`
- Large batch operations should be throttled to avoid UI lag

## Security Considerations

- Only enable remote control in trusted environments
- WebSocket endpoint should be secured (WSS in production)
- Consider adding authentication tokens to WebSocket connection
- Validate all command parameters on the frontend
- Rate limit commands to prevent abuse
