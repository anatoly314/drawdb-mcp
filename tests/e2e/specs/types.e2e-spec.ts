import { callTool, listTools } from "../helpers/mcp";
import { resetDiagram } from "../helpers/reset";
import { assertMatchesFixture } from "../helpers/fixtures";

interface ToolResult {
  success?: boolean;
  typeId?: string;
  summary?: { typeCount?: number };
  sql?: string;
  data?: { sql?: string };
  [k: string]: unknown;
}

describe("Types (PostgreSQL composite)", () => {
  it("smoke: tools/list includes expected type tools", () => {
    const tools = listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(["add_type", "update_type", "delete_type"]));
  });

  describe("behavioral", () => {
    beforeEach(() => {
      resetDiagram();
      const setDb = callTool("set_database", { database: "postgresql" }) as ToolResult;
      expect(setDb.success).toBe(true);
    });

    it("adds a composite type with fields", () => {
      const add = callTool("add_type", {
        name: "address_type",
        fields: [
          { name: "street", type: "VARCHAR" },
          { name: "city", type: "VARCHAR" },
        ],
      }) as ToolResult;
      expect(add.success).toBe(true);
      expect(add.typeId !== undefined).toBe(true);

      const diagram = callTool("get_diagram", {}) as ToolResult;
      expect(diagram.summary?.typeCount).toBe(1);
    });

    it("updates a composite type", () => {
      const add = callTool("add_type", {
        name: "point_type",
        fields: [{ name: "x", type: "NUMERIC" }],
      }) as ToolResult;
      const typeId = String(add.typeId);

      const upd = callTool("update_type", {
        typeId,
        fields: [
          { name: "x", type: "NUMERIC" },
          { name: "y", type: "NUMERIC" },
        ],
      }) as ToolResult;
      expect(upd.success).toBe(true);
    });

    it("deletes a composite type", () => {
      const add = callTool("add_type", {
        name: "tmp_type",
        fields: [{ name: "val", type: "INTEGER" }],
      }) as ToolResult;
      const typeId = String(add.typeId);

      const del = callTool("delete_type", { typeId }) as ToolResult;
      expect(del.success).toBe(true);

      const diagram = callTool("get_diagram", {}) as ToolResult;
      expect(diagram.summary?.typeCount).toBe(0);
    });
  });

  describe("golden-file", () => {
    beforeEach(() => {
      resetDiagram();
      callTool("set_database", { database: "postgresql" });
    });

    it("exports a composite type as expected SQL", () => {
      const add = callTool("add_type", {
        name: "contact_info",
        fields: [
          { name: "email", type: "VARCHAR" },
          { name: "phone", type: "VARCHAR" },
        ],
      }) as ToolResult;
      expect(add.success).toBe(true);

      const exported = callTool("export_sql", {}) as ToolResult;
      const sql = (exported.sql ?? exported.data?.sql) as string;
      assertMatchesFixture(sql, "types-canonical.sql");
    });
  });
});
