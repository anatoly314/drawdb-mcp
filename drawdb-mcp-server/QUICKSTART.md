# Quick Start Guide

Get the DrawDB MCP server up and running in 5 minutes.

## Step 1: Install Dependencies

```bash
cd drawdb-mcp-server
npm install
```

## Step 2: Build the Server

```bash
npm run build
```

## Step 3: Configure DrawDB Frontend

In the main DrawDB project directory, create or edit `.env`:

```env
VITE_REMOTE_CONTROL_ENABLED=true
VITE_REMOTE_CONTROL_WS=ws://localhost:3000/remote-control
```

## Step 4: Start DrawDB Frontend

```bash
cd ../  # Go back to drawdb root
npm run dev
```

The frontend should now be running at `http://localhost:5173` (or similar).

## Step 5: Start the MCP Server

In a new terminal:

```bash
cd drawdb-mcp-server
npm run start:dev:http
```

You should see:
```
DrawDB MCP Server started
HTTP server listening on http://localhost:3000
MCP endpoint: http://localhost:3000/mcp
WebSocket endpoint: ws://localhost:3000/remote-control
```

## Step 6: Open DrawDB in Browser

1. Navigate to `http://localhost:5173`
2. Open the browser console (F12)
3. You should see: "AI Assistant connected" toast notification

## Step 7: Test with Claude Desktop (Optional)

Add to your Claude config (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):

```json
{
  "mcpServers": {
    "drawdb": {
      "command": "node",
      "args": ["/full/path/to/drawdb-mcp-server/dist/main-http.js"],
      "env": {}
    }
  }
}
```

Restart Claude Desktop, then try:

> "Can you create a users table with id, email, and name fields?"

## Troubleshooting

**Frontend not connecting?**
- Check that both servers are running
- Verify the WebSocket URL in `.env` matches the server port
- Check browser console for errors

**MCP tools not working?**
- Ensure DrawDB frontend shows "AI Assistant connected"
- Try the `get_diagram` tool to verify connection

**Port already in use?**
- Change the port in `.env` and when starting the server:
  ```bash
  node dist/main-http.js --port 8080
  ```

## Next Steps

- Read `README.md` for complete documentation
- Check out the `/docs/REMOTE_CONTROL.md` in the main DrawDB repo for protocol details
- Add more MCP tools in `src/mcp/primitives/essential/tools/`
