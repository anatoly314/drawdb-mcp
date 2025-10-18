# DrawDB MCP Server

Model Context Protocol (MCP) server that enables AI assistants to create and modify database diagrams in DrawDB via WebSocket.

## Overview

This MCP server acts as a bridge between AI assistants (like Claude) and the DrawDB diagram editor. It provides tools for:

- Creating and managing database tables
- Adding relationships (foreign keys)
- Querying diagram state
- Managing areas, notes, and other diagram elements

## Architecture

```
AI Assistant (Claude, etc.)
    ↓ (MCP protocol)
DrawDB MCP Server (this project)
    ↓ (WebSocket commands)
DrawDB Frontend (with remote control enabled)
    ↓ (React state updates)
Diagram Editor
```

## Prerequisites

- Node.js 20 or higher
- DrawDB frontend running with remote control enabled

## Installation

\`\`\`bash

# Clone the repository

cd drawdb-mcp-server

# Install dependencies

npm install

# Build the project

npm run build
\`\`\`

## Configuration

The DrawDB frontend must be configured to accept remote control:

1. In the DrawDB project, create a \`.env\` file:
   \`\`\`env
   VITE_REMOTE_CONTROL_ENABLED=true
   VITE_REMOTE_CONTROL_WS=ws://localhost:8080/remote-control
   \`\`\`

2. Start the DrawDB frontend:
   \`\`\`bash
   cd ../path/to/drawdb
   npm run dev
   \`\`\`

## Running the Server

### Development Mode

\`\`\`bash

# Start in development mode with auto-reload

npm run start:dev:http
\`\`\`

The server will start on \`http://localhost:3000\` by default.

### Production Mode

\`\`\`bash

# Build first

npm run build

# Start production server

npm run start:prod:http
\`\`\`

### Command Line Options

\`\`\`bash

# Custom port

node dist/main-http.js --port 8080

# Custom host

node dist/main-http.js --host 0.0.0.0

# Both

node dist/main-http.js --port 8080 --host 127.0.0.1
\`\`\`

## Available MCP Tools

### \`add_table\`

Add a new table to the database diagram.

**Parameters:**

- \`name\` (string, required): Table name
- \`x\` (number, optional): X coordinate on canvas (default: 100)
- \`y\` (number, optional): Y coordinate on canvas (default: 100)
- \`fields\` (array, optional): Array of field definitions
- \`color\` (string, optional): Table color (default: #175e7a)
- \`comment\` (string, optional): Table comment

### \`get_diagram\`

Get the current state of the entire diagram.

**Parameters:** None

**Returns:**

- Full diagram state including all tables, relationships, areas, notes
- Summary with counts and table information

### \`add_relationship\`

Add a foreign key relationship between two tables.

**Parameters:**

- \`name\` (string, required): Relationship name
- \`startTableId\` (string, required): Source table ID
- \`startFieldId\` (string, required): Source field ID
- \`endTableId\` (string, required): Target table ID
- \`endFieldId\` (string, required): Target field ID
- \`cardinality\` (enum, optional): one_to_one, one_to_many, many_to_one (default: many_to_one)

## License

MIT
