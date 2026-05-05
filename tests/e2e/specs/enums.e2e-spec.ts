import { callTool, listTools } from '../helpers/mcp';
import { resetDiagram } from '../helpers/reset';
import { assertMatchesFixture } from '../helpers/fixtures';

interface ToolResult {
  success?: boolean;
  enumId?: string;
  summary?: { enumCount?: number };
  sql?: string;
  data?: { sql?: string };
  [k: string]: unknown;
}

describe('Enums', () => {
  it('smoke: tools/list includes expected enum tools', () => {
    const tools = listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(['add_enum', 'update_enum', 'delete_enum']),
    );
  });

  describe('behavioral', () => {
    beforeEach(() => {
      resetDiagram();
      const setDb = callTool('set_database', { database: 'postgresql' }) as ToolResult;
      expect(setDb.success).toBe(true);
    });

    it('adds an enum with values', () => {
      const add = callTool('add_enum', {
        name: 'user_status',
        values: ['pending', 'active', 'suspended'],
      }) as ToolResult;
      expect(add.success).toBe(true);
      expect(add.enumId !== undefined).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      expect(diagram.summary?.enumCount).toBe(1);
    });

    it('updates enum values', () => {
      const add = callTool('add_enum', {
        name: 'priority',
        values: ['low', 'high'],
      }) as ToolResult;
      const enumId = String(add.enumId);

      const upd = callTool('update_enum', {
        enumId,
        values: ['low', 'medium', 'high'],
      }) as ToolResult;
      expect(upd.success).toBe(true);
    });

    it('deletes an enum', () => {
      const add = callTool('add_enum', {
        name: 'role',
        values: ['admin', 'user'],
      }) as ToolResult;
      const enumId = String(add.enumId);

      const del = callTool('delete_enum', { enumId }) as ToolResult;
      expect(del.success).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      expect(diagram.summary?.enumCount).toBe(0);
    });
  });

  describe('golden-file', () => {
    beforeEach(() => {
      resetDiagram();
      callTool('set_database', { database: 'postgresql' });
    });

    it('exports an enum as expected SQL', () => {
      const add = callTool('add_enum', {
        name: 'order_status',
        values: ['placed', 'paid', 'shipped', 'delivered', 'cancelled'],
      }) as ToolResult;
      expect(add.success).toBe(true);

      const exported = callTool('export_sql', {}) as ToolResult;
      const sql = (exported.sql ?? exported.data?.sql) as string;
      assertMatchesFixture(sql, 'enums-canonical.sql');
    });
  });
});
