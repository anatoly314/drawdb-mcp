import { callTool, listTools } from "../helpers/mcp";
import { resetDiagram } from "../helpers/reset";
import { assertMatchesFixture } from "../helpers/fixtures";

interface ToolResult {
  success?: boolean;
  tableId?: string;
  fieldId?: string;
  fieldIds?: { name: string; id: string }[];
  table?: { fields?: { id: string; name: string; type: string }[] };
  sql?: string;
  data?: { sql?: string };
  [k: string]: unknown;
}

function addTableWithIdField(): { tableId: string; idFieldId: string } {
  const add = callTool("add_table", {
    name: "items",
    fields: [{ name: "id", type: "INTEGER", primary: true, notNull: true }],
  }) as ToolResult;
  expect(add.success).toBe(true);
  const tableId = add.tableId as string;
  const fieldIds = add.fieldIds ?? [];
  expect(fieldIds.length).toBe(1);
  return { tableId, idFieldId: fieldIds[0].id };
}

describe("Fields", () => {
  it("smoke: tools/list includes expected field tools", () => {
    const tools = listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(["add_field", "update_field", "delete_field"]));
  });

  describe("behavioral", () => {
    beforeEach(() => {
      resetDiagram();
    });

    it("adds a field to an existing table", () => {
      const { tableId } = addTableWithIdField();

      const add = callTool("add_field", {
        tableId,
        name: "description",
        type: "TEXT",
      }) as ToolResult;
      expect(add.success).toBe(true);
      expect(typeof add.fieldId).toBe("string");

      const got = callTool("get_table", { tableId }) as ToolResult;
      const names = (got.table?.fields ?? []).map((f) => f.name);
      expect(names).toContain("description");
    });

    it("updates a field type", () => {
      const { tableId } = addTableWithIdField();
      const add = callTool("add_field", {
        tableId,
        name: "amount",
        type: "INTEGER",
      }) as ToolResult;
      const fieldId = add.fieldId as string;

      const upd = callTool("update_field", {
        tableId,
        fieldId,
        type: "BIGINT",
      }) as ToolResult;
      expect(upd.success).toBe(true);

      const got = callTool("get_table", { tableId }) as ToolResult;
      const updated = (got.table?.fields ?? []).find((f) => f.id === fieldId);
      expect(updated?.type).toBe("BIGINT");
    });

    it("deletes a field", () => {
      const { tableId } = addTableWithIdField();
      const add = callTool("add_field", {
        tableId,
        name: "temporary",
        type: "TEXT",
      }) as ToolResult;
      const fieldId = add.fieldId as string;

      const del = callTool("delete_field", { tableId, fieldId }) as ToolResult;
      expect(del.success).toBe(true);

      const got = callTool("get_table", { tableId }) as ToolResult;
      const names = (got.table?.fields ?? []).map((f) => f.name);
      expect(names).not.toContain("temporary");
    });
  });

  describe("golden-file", () => {
    beforeEach(() => {
      resetDiagram();
    });

    it("exports a 4-field table as expected SQL", () => {
      const setDb = callTool("set_database", { database: "postgresql" }) as ToolResult;
      expect(setDb.success).toBe(true);

      const add = callTool("add_table", {
        name: "products",
        fields: [
          { name: "id", type: "SERIAL", primary: true, notNull: true },
          { name: "name", type: "VARCHAR", notNull: true },
          { name: "price", type: "NUMERIC", notNull: true },
          { name: "active", type: "BOOLEAN", notNull: true, default: "true" },
        ],
      }) as ToolResult;
      expect(add.success).toBe(true);

      const exported = callTool("export_sql", {}) as ToolResult;
      const sql = (exported.sql ?? exported.data?.sql) as string;
      assertMatchesFixture(sql, "fields-canonical.sql");
    });
  });
});
