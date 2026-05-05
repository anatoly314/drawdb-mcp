import { callTool, listTools } from '../helpers/mcp';
import { resetDiagram } from '../helpers/reset';
import { assertMatchesFixture } from '../helpers/fixtures';

interface ToolResult {
  success?: boolean;
  message?: string;
  tableId?: string;
  table?: { name?: string; color?: string; fields?: unknown[] };
  summary?: { fieldCount?: number };
  sql?: string;
  data?: { sql?: string };
  [k: string]: unknown;
}

describe('Tables', () => {
  it('smoke: tools/list includes expected table tools', () => {
    const tools = listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'add_table',
        'update_table',
        'delete_table',
        'get_table',
      ]),
    );
  });

  describe('behavioral', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('adds a table and retrieves it by name', () => {
      const add = callTool('add_table', {
        name: 'users',
        fields: [{ name: 'id', type: 'INTEGER', primary: true, increment: true, notNull: true }],
      }) as ToolResult;
      expect(add.success).toBe(true);
      expect(typeof add.tableId).toBe('string');

      const got = callTool('get_table', { tableName: 'users' }) as ToolResult;
      expect(got.success).toBe(true);
      expect(got.table?.name).toBe('users');
    });

    it('updates a table name', () => {
      const add = callTool('add_table', { name: 'old_name' }) as ToolResult;
      expect(add.success).toBe(true);
      const tableId = add.tableId as string;

      const upd = callTool('update_table', {
        tableId,
        name: 'new_name',
      }) as ToolResult;
      expect(upd.success).toBe(true);

      const got = callTool('get_table', { tableId }) as ToolResult;
      expect(got.success).toBe(true);
      expect(got.table?.name).toBe('new_name');
    });

    it('deletes a table', () => {
      const add = callTool('add_table', { name: 'to_delete' }) as ToolResult;
      expect(add.success).toBe(true);
      const tableId = add.tableId as string;

      const del = callTool('delete_table', { tableId }) as ToolResult;
      expect(del.success).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      const summary = diagram.summary as { tableCount?: number } | undefined;
      expect(summary?.tableCount).toBe(0);
    });

    it('adds a table with a custom color', () => {
      const add = callTool('add_table', {
        name: 'colored',
        color: '#abcdef',
      }) as ToolResult;
      expect(add.success).toBe(true);

      const got = callTool('get_table', { tableName: 'colored' }) as ToolResult;
      expect(got.table?.color).toBe('#abcdef');
    });
  });

  describe('golden-file', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('exports canonical single-table schema as expected SQL', () => {
      const setDb = callTool('set_database', { database: 'postgresql' }) as ToolResult;
      expect(setDb.success).toBe(true);

      const add = callTool('add_table', {
        name: 'users',
        fields: [
          { name: 'id', type: 'SERIAL', primary: true, notNull: true },
          { name: 'email', type: 'VARCHAR', unique: true, notNull: true },
          { name: 'created_at', type: 'TIMESTAMP', notNull: true },
        ],
      }) as ToolResult;
      expect(add.success).toBe(true);

      const exported = callTool('export_sql', {}) as ToolResult;
      expect(exported.success).toBe(true);
      const sql = (exported.sql ?? exported.data?.sql) as string;
      expect(typeof sql).toBe('string');
      assertMatchesFixture(sql, 'tables-canonical.sql');
    });
  });
});
