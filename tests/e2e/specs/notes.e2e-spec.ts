import { callTool, listTools } from '../helpers/mcp';
import { resetDiagram } from '../helpers/reset';
import { assertMatchesFixture } from '../helpers/fixtures';

interface ToolResult {
  success?: boolean;
  noteId?: number | string;
  summary?: { noteCount?: number };
  sql?: string;
  data?: { sql?: string };
  [k: string]: unknown;
}

describe('Notes', () => {
  it('smoke: tools/list includes expected note tools', () => {
    const tools = listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(['add_note', 'update_note', 'delete_note']),
    );
  });

  describe('behavioral', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('adds a note', () => {
      const add = callTool('add_note', {
        title: 'Design decision',
        content: 'Using soft deletes everywhere.',
      }) as ToolResult;
      expect(add.success).toBe(true);
      expect(add.noteId !== undefined).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      expect(diagram.summary?.noteCount).toBe(1);
    });

    it('updates note content', () => {
      const add = callTool('add_note', {
        title: 'Note',
        content: 'original',
      }) as ToolResult;
      const noteId = String(add.noteId);

      const upd = callTool('update_note', {
        noteId,
        content: 'updated',
      }) as ToolResult;
      expect(upd.success).toBe(true);
    });

    it('deletes a note', () => {
      const add = callTool('add_note', {
        title: 'Temp',
        content: 'temp',
      }) as ToolResult;
      const noteId = String(add.noteId);

      const del = callTool('delete_note', { noteId }) as ToolResult;
      expect(del.success).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      expect(diagram.summary?.noteCount).toBe(0);
    });
  });

  describe('golden-file', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('exports empty SQL when only a note is present (postgresql)', () => {
      const setDb = callTool('set_database', { database: 'postgresql' }) as ToolResult;
      expect(setDb.success).toBe(true);

      const add = callTool('add_note', {
        title: 'Important',
        content: 'Remember to add indexes on foreign keys.',
      }) as ToolResult;
      expect(add.success).toBe(true);

      const exported = callTool('export_sql', {}) as ToolResult;
      const sql = (exported.sql ?? exported.data?.sql) as string;
      assertMatchesFixture(sql, 'notes-canonical.sql');
    });
  });
});
