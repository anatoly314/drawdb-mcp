import { callTool, listTools } from '../helpers/mcp';
import { resetDiagram } from '../helpers/reset';
import { assertMatchesFixture } from '../helpers/fixtures';

interface ToolResult {
  success?: boolean;
  tableId?: string;
  fieldIds?: { name: string; id: string }[];
  relationshipId?: string;
  sql?: string;
  dbml?: string;
  database?: string;
  data?: { sql?: string; dbml?: string };
  summary?: { tableCount?: number; database?: string };
  [k: string]: unknown;
}

function buildCanonicalSchema(): void {
  const setDb = callTool('set_database', { database: 'postgresql' }) as ToolResult;
  expect(setDb.success).toBe(true);

  const users = callTool('add_table', {
    name: 'users',
    fields: [
      { name: 'id', type: 'SERIAL', primary: true, notNull: true },
      { name: 'email', type: 'VARCHAR', unique: true, notNull: true },
    ],
  }) as ToolResult;
  expect(users.success).toBe(true);

  const posts = callTool('add_table', {
    name: 'posts',
    fields: [
      { name: 'id', type: 'SERIAL', primary: true, notNull: true },
      { name: 'user_id', type: 'INTEGER', notNull: true },
      { name: 'title', type: 'VARCHAR', notNull: true },
    ],
  }) as ToolResult;
  expect(posts.success).toBe(true);

  const usersIdField = (users.fieldIds ?? []).find((f) => f.name === 'id');
  const postsUserIdField = (posts.fieldIds ?? []).find((f) => f.name === 'user_id');
  expect(usersIdField).toBeDefined();
  expect(postsUserIdField).toBeDefined();

  const rel = callTool('add_relationship', {
    name: 'fk_posts_user',
    startTableId: posts.tableId as string,
    startFieldId: postsUserIdField!.id,
    endTableId: users.tableId as string,
    endFieldId: usersIdField!.id,
    cardinality: 'many_to_one',
  }) as ToolResult;
  expect(rel.success).toBe(true);
}

describe('Export/Import (SQL & DBML)', () => {
  it('smoke: tools/list includes export/import tools', () => {
    const tools = listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(['export_sql', 'export_dbml', 'import_dbml']),
    );
  });

  describe('behavioral', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('exports SQL after building a schema', () => {
      buildCanonicalSchema();
      const exported = callTool('export_sql', {}) as ToolResult;
      expect(exported.success).toBe(true);
      const sql = (exported.sql ?? exported.data?.sql) as string;
      expect(typeof sql).toBe('string');
      expect(sql.length).toBeGreaterThan(0);
      expect(sql.toUpperCase()).toContain('CREATE TABLE');
    });

    it('exports DBML after building a schema', () => {
      buildCanonicalSchema();
      const exported = callTool('export_dbml', {}) as ToolResult;
      expect(exported.success).toBe(true);
      const dbml = (exported.dbml ?? exported.data?.dbml) as string;
      expect(typeof dbml).toBe('string');
      expect(dbml.length).toBeGreaterThan(0);
      expect(dbml.toLowerCase()).toContain('table');
    });

    it('imports DBML and creates expected tables', () => {
      const dbml = `
Table users {
  id integer [pk]
  email varchar [unique, not null]
}

Table posts {
  id integer [pk]
  user_id integer [ref: > users.id]
  title varchar [not null]
}
      `.trim();
      const imp = callTool('import_dbml', { dbml, clearCurrent: true }) as ToolResult;
      expect(imp.success).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      expect((diagram.summary?.tableCount ?? 0)).toBeGreaterThanOrEqual(2);
    });
  });

  describe('golden-file', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('exports canonical schema as expected SQL', () => {
      buildCanonicalSchema();
      const exported = callTool('export_sql', {}) as ToolResult;
      const sql = (exported.sql ?? exported.data?.sql) as string;
      assertMatchesFixture(sql, 'export-import-canonical.sql');
    });

    it('exports canonical schema as expected DBML', () => {
      buildCanonicalSchema();
      const exported = callTool('export_dbml', {}) as ToolResult;
      const dbml = (exported.dbml ?? exported.data?.dbml) as string;
      assertMatchesFixture(dbml, 'export-import-canonical.dbml');
    });
  });
});
