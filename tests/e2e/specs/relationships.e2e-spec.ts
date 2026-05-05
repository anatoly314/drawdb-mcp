import { callTool, listTools } from '../helpers/mcp';
import { resetDiagram } from '../helpers/reset';
import { assertMatchesFixture } from '../helpers/fixtures';

interface ToolResult {
  success?: boolean;
  tableId?: string;
  fieldId?: string;
  fieldIds?: { name: string; id: string }[];
  relationshipId?: string;
  summary?: { relationshipCount?: number };
  sql?: string;
  data?: { sql?: string };
  [k: string]: unknown;
}

function setupTwoTables(): {
  ordersTableId: string;
  ordersIdFieldId: string;
  itemsTableId: string;
  itemsOrderIdFieldId: string;
} {
  const orders = callTool('add_table', {
    name: 'orders',
    fields: [{ name: 'id', type: 'INTEGER', primary: true, notNull: true }],
  }) as ToolResult;
  const items = callTool('add_table', {
    name: 'items',
    fields: [
      { name: 'id', type: 'INTEGER', primary: true, notNull: true },
      { name: 'order_id', type: 'INTEGER', notNull: true },
    ],
  }) as ToolResult;
  const itemsFieldIds = items.fieldIds ?? [];
  const orderIdField = itemsFieldIds.find((f) => f.name === 'order_id');
  expect(orderIdField).toBeDefined();
  const ordersIdField = (orders.fieldIds ?? []).find((f) => f.name === 'id');
  expect(ordersIdField).toBeDefined();
  return {
    ordersTableId: orders.tableId as string,
    ordersIdFieldId: ordersIdField!.id,
    itemsTableId: items.tableId as string,
    itemsOrderIdFieldId: orderIdField!.id,
  };
}

describe('Relationships', () => {
  it('smoke: tools/list includes expected relationship tools', () => {
    const tools = listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'add_relationship',
        'update_relationship',
        'delete_relationship',
      ]),
    );
  });

  describe('behavioral', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('adds a relationship between two tables', () => {
      const ids = setupTwoTables();
      const rel = callTool('add_relationship', {
        name: 'fk_items_order',
        startTableId: ids.itemsTableId,
        startFieldId: ids.itemsOrderIdFieldId,
        endTableId: ids.ordersTableId,
        endFieldId: ids.ordersIdFieldId,
        cardinality: 'many_to_one',
      }) as ToolResult;
      expect(rel.success).toBe(true);
      expect(typeof rel.relationshipId).toBe('string');

      const diagram = callTool('get_diagram', {}) as ToolResult;
      expect(diagram.summary?.relationshipCount).toBe(1);
    });

    it('updates a relationship cardinality', () => {
      const ids = setupTwoTables();
      const rel = callTool('add_relationship', {
        name: 'fk1',
        startTableId: ids.itemsTableId,
        startFieldId: ids.itemsOrderIdFieldId,
        endTableId: ids.ordersTableId,
        endFieldId: ids.ordersIdFieldId,
        cardinality: 'many_to_one',
      }) as ToolResult;
      const relationshipId = rel.relationshipId as string;

      const upd = callTool('update_relationship', {
        relationshipId,
        cardinality: 'one_to_one',
      }) as ToolResult;
      expect(upd.success).toBe(true);
    });

    it('deletes a relationship', () => {
      const ids = setupTwoTables();
      const rel = callTool('add_relationship', {
        name: 'fk1',
        startTableId: ids.itemsTableId,
        startFieldId: ids.itemsOrderIdFieldId,
        endTableId: ids.ordersTableId,
        endFieldId: ids.ordersIdFieldId,
      }) as ToolResult;
      const relationshipId = rel.relationshipId as string;

      const del = callTool('delete_relationship', { relationshipId }) as ToolResult;
      expect(del.success).toBe(true);

      const diagram = callTool('get_diagram', {}) as ToolResult;
      expect(diagram.summary?.relationshipCount).toBe(0);
    });
  });

  describe('golden-file', () => {
    beforeEach(() => {
      resetDiagram();
    });

    it('exports two related tables as expected SQL', () => {
      const setDb = callTool('set_database', { database: 'postgresql' }) as ToolResult;
      expect(setDb.success).toBe(true);

      const ids = setupTwoTables();
      const rel = callTool('add_relationship', {
        name: 'fk_items_order',
        startTableId: ids.itemsTableId,
        startFieldId: ids.itemsOrderIdFieldId,
        endTableId: ids.ordersTableId,
        endFieldId: ids.ordersIdFieldId,
        cardinality: 'many_to_one',
      }) as ToolResult;
      expect(rel.success).toBe(true);

      const exported = callTool('export_sql', {}) as ToolResult;
      const sql = (exported.sql ?? exported.data?.sql) as string;
      assertMatchesFixture(sql, 'relationships-canonical.sql');
    });
  });
});
