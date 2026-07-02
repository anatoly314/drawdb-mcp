import { useDiagram } from "../../hooks";
import { useServerHandler } from "../ws";

/**
 * Server->client handlers for table commands:
 * addTable / updateTable / deleteTable / getTable.
 */
export default function useTableHandlers() {
  const diagram = useDiagram();

  useServerHandler("addTable", (params) => {
    // Two-phase add: the backend only ever sends `data: null` (the GUI
    // creates a default table and returns it; the real name/fields arrive in
    // a follow-up updateTable). Non-null data would be misread by the
    // context's add() as an undo/redo `{index, table}` shape, so reject it.
    if (params.data != null) {
      throw new Error("addTable with non-null data is not supported");
    }
    return diagram.addTable(null, params.addToHistory ?? true);
  });

  useServerHandler("updateTable", (params) => {
    diagram.updateTable(params.id, params.updates);
  });

  useServerHandler("deleteTable", (params) => {
    diagram.deleteTable(params.id, params.addToHistory ?? true);
  });

  useServerHandler("getTable", (params) => {
    let table = null;
    if (params.tableId) {
      table = diagram.tables.find((t) => t.id === params.tableId);
    } else if (params.tableName) {
      table = diagram.tables.find((t) => t.name === params.tableName);
    }

    if (!table) {
      throw new Error(`Table not found: ${params.tableId || params.tableName}`);
    }

    return table;
  });
}
