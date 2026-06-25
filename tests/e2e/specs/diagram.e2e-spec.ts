import { callTool, listTools } from "../helpers/mcp";
import { resetDiagram } from "../helpers/reset";
import { assertMatchesFixture, loadFixture } from "../helpers/fixtures";

interface ToolResult {
  success?: boolean;
  json?: string;
  summary?: {
    tableCount?: number;
    relationshipCount?: number;
    areaCount?: number;
    noteCount?: number;
    database?: string;
  };
  sql?: string;
  data?: { sql?: string };
  [k: string]: unknown;
}

describe("Diagram", () => {
  it("smoke: tools/list includes expected diagram tools", () => {
    const tools = listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(["get_diagram", "import_diagram", "export_diagram"]),
    );
  });

  describe("behavioral", () => {
    beforeEach(() => {
      resetDiagram();
    });

    it("returns an empty diagram after reset", () => {
      const diagram = callTool("get_diagram", {}) as ToolResult;
      expect(diagram.success).toBe(true);
      expect(diagram.summary?.tableCount).toBe(0);
      expect(diagram.summary?.relationshipCount).toBe(0);
    });

    it("imports a diagram and replaces state", () => {
      const fixtureJson = loadFixture("diagram-canonical.json");
      const imp = callTool("import_diagram", {
        json: fixtureJson,
        clearCurrent: true,
      }) as ToolResult;
      expect(imp.success).toBe(true);

      const diagram = callTool("get_diagram", {}) as ToolResult;
      expect(diagram.success).toBe(true);
      expect(diagram.summary?.tableCount).toBeGreaterThan(0);
    });

    it("export_diagram returns parseable JSON", () => {
      const exported = callTool("export_diagram", { formatted: false }) as ToolResult;
      expect(exported.success).toBe(true);
      expect(typeof exported.json).toBe("string");
      const parsed = JSON.parse(exported.json as string) as Record<string, unknown>;
      expect(parsed).toHaveProperty("tables");
      expect(parsed).toHaveProperty("relationships");
    });

    it("round-trips export -> import -> export to the same JSON", () => {
      callTool("add_table", {
        name: "roundtrip",
        fields: [{ name: "id", type: "INTEGER", primary: true, notNull: true }],
      });
      const first = callTool("export_diagram", { formatted: false }) as ToolResult;
      const firstJson = first.json as string;

      const imp = callTool("import_diagram", { json: firstJson, clearCurrent: true }) as ToolResult;
      expect(imp.success).toBe(true);

      const second = callTool("export_diagram", { formatted: false }) as ToolResult;
      expect(second.json).toBe(firstJson);
    });
  });

  describe("golden-file", () => {
    beforeEach(() => {
      resetDiagram();
    });

    it("imports canonical diagram fixture and exports matching SQL", () => {
      const fixtureJson = loadFixture("diagram-canonical.json");
      const imp = callTool("import_diagram", {
        json: fixtureJson,
        clearCurrent: true,
      }) as ToolResult;
      expect(imp.success).toBe(true);

      const exported = callTool("export_sql", {}) as ToolResult;
      const sql = (exported.sql ?? exported.data?.sql) as string;
      assertMatchesFixture(sql, "diagram-canonical.sql");
    });
  });
});
