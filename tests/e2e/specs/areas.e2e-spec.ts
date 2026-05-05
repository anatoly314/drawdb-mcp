import { callTool, listTools } from '../helpers/mcp';
import { resetDiagram } from '../helpers/reset';
import { assertMatchesFixture } from '../helpers/fixtures';

interface ToolResult {
  success?: boolean;
  areaId?: number | string;
  summary?: { areaCount?: number; areas?: { id: number; name: string }[] };
  sql?: string;
  data?: { sql?: string };
  [k: string]: unknown;
}

describe('Areas', () => {
  it('smoke: tools/list includes expected area tools', () => {
    const tools = listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(['add_area', 'update_area', 'delete_area']),
    );
  });

  describe('behavioral', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('adds an area and reports it in the diagram', () => {
      const add = callTool('add_area', { name: 'auth_module' }) as ToolResult;
      expect(add.success).toBe(true);
      expect(add.areaId !== undefined).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      expect(diagram.summary?.areaCount).toBe(1);
    });

    it('updates an area name', () => {
      const add = callTool('add_area', { name: 'first' }) as ToolResult;
      const areaId = String(add.areaId);

      const upd = callTool('update_area', { areaId, name: 'renamed' }) as ToolResult;
      expect(upd.success).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      const names = (diagram.summary?.areas ?? []).map((a) => a.name);
      expect(names).toContain('renamed');
    });

    it('deletes an area', () => {
      const add = callTool('add_area', { name: 'to_delete' }) as ToolResult;
      const areaId = String(add.areaId);

      const del = callTool('delete_area', { areaId }) as ToolResult;
      expect(del.success).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      expect(diagram.summary?.areaCount).toBe(0);
    });
  });

  describe('golden-file', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('exports an empty SQL when only areas are present (postgresql)', () => {
      const setDb = callTool('set_database', { database: 'postgresql' }) as ToolResult;
      expect(setDb.success).toBe(true);

      const a1 = callTool('add_area', { name: 'public_module' }) as ToolResult;
      expect(a1.success).toBe(true);
      const a2 = callTool('add_area', { name: 'admin_module' }) as ToolResult;
      expect(a2.success).toBe(true);

      const exported = callTool('export_sql', {}) as ToolResult;
      const sql = (exported.sql ?? exported.data?.sql) as string;
      assertMatchesFixture(sql, 'areas-canonical.sql');
    });
  });
});
