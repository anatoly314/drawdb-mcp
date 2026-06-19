import { Typography } from "@douyinfe/semi-ui";
import { socials } from "../data/socials";

const { Title, Paragraph, Text } = Typography;

function Code({ children }) {
  return (
    <pre className="my-2 p-3 rounded-md bg-zinc-100 text-zinc-800 text-sm overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

export default function Docs() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <Title heading={2}>DrawDB-MCP</Title>
        <Paragraph>
          DrawDB is a database entity-relationship diagram editor, extended here
          with AI-assistant control via the Model Context Protocol (MCP). An AI
          assistant (e.g. Claude) can create and modify diagrams
          programmatically while you watch it happen live in the browser.
        </Paragraph>
      </div>

      <div>
        <Title heading={4}>Run it</Title>
        <Paragraph>The quickest way is Docker:</Paragraph>
        <Code>
          docker run --name drawdb-mcp -p 8080:80 -p 3000:3000
          ghcr.io/anatoly314/drawdb-mcp:latest
        </Code>
        <Paragraph>
          The GUI is served at{" "}
          <Text code>http://localhost:8080</Text> and the MCP server listens at{" "}
          <Text code>http://127.0.0.1:3000</Text>.
        </Paragraph>
        <Paragraph>
          For local development you can instead run{" "}
          <Text code>pnpm dev</Text>, which serves the GUI at{" "}
          <Text code>http://localhost:5173</Text> and the backend at{" "}
          <Text code>http://localhost:3000</Text>.
        </Paragraph>
      </div>

      <div>
        <Title heading={4}>Connect / attach an AI assistant</Title>
        <Paragraph>Register the MCP server with your assistant:</Paragraph>
        <Code>
          claude mcp add --transport http drawdb-mcp http://127.0.0.1:3000
        </Code>
        <Paragraph>
          Once attached, the assistant&apos;s MCP tools drive this editor over a
          WebSocket connection. Keep the editor tab open while you work — only
          one tab can be controlled at a time, and opening a new one takes over
          the connection.
        </Paragraph>
      </div>

      <div>
        <Title heading={4}>What the assistant can do</Title>
        <Paragraph>
          The assistant can create and edit tables and fields, relationships,
          subject areas, and notes; manage enums and types (PostgreSQL); and
          export the diagram to SQL or DBML.
        </Paragraph>
      </div>

      <div id="shortcuts">
        <Title heading={4}>Keyboard shortcuts</Title>
        <table className="w-full text-sm border-collapse">
          <tbody>
            {[
              ["Ctrl+S", "Save"],
              ["Ctrl+Shift+S", "Save as"],
              ["Ctrl+Z", "Undo"],
              ["Ctrl+Y", "Redo"],
              ["Ctrl+I", "Import"],
              ["Ctrl+O", "Open"],
              ["Ctrl+E", "Edit"],
              ["Ctrl+D", "Duplicate"],
              ["Ctrl+C / Ctrl+V / Ctrl+X", "Copy / Paste / Cut"],
              ["Delete", "Delete selected"],
              ["Ctrl+Shift+G", "Toggle grid"],
              ["Ctrl+↑ / Ctrl+↓", "Zoom in / out"],
              ["Ctrl+Alt+W", "Fit window"],
              ["Enter", "Reset view"],
              ["Ctrl+Shift+M", "Strict mode"],
              ["Ctrl+Shift+F", "Field summary"],
              ["Ctrl+Alt+C", "Copy as image"],
              ["Alt+E", "Toggle DBML editor"],
              ["Ctrl+H", "Open docs"],
            ].map(([keys, action]) => (
              <tr key={keys} className="border-b border-zinc-100">
                <td className="py-1 pr-4 align-top whitespace-nowrap">
                  <Text code>{keys}</Text>
                </td>
                <td className="py-1">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <Title heading={4}>Learn more</Title>
        <Paragraph>
          See the project on{" "}
          <a className="text-blue-600" href={socials.github}>
            GitHub
          </a>
          .
        </Paragraph>
      </div>
    </div>
  );
}
