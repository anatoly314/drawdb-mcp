import { useDiagram } from "../../hooks";
import { dbToTypes } from "../../data/datatypes";
import { useServerHandler } from "../ws";

/**
 * Backfill type-driven defaults on a field created/retyped through the MCP
 * layer, mirroring what the GUI does in TableField.jsx on type change.
 *
 * The GUI sets `size` from the datatype's `defaultSize` whenever a field's
 * type is chosen; MCP-created fields skip that path, leaving VARCHAR (and
 * other sized types) with `size === undefined`. That trips the GUI validator
 * (checkDefault: `field.default.length <= field.size`) and can emit invalid
 * DDL for MySQL/MariaDB.
 *
 * Only `defaultSize` is backfilled, and only when the caller did not provide a
 * usable size. If the type isn't found for the current database, the field is
 * returned untouched (no crash). Type keys are uppercase, matching the GUI.
 */
function withTypeDefaults(field, database) {
  if (!field || typeof field.type !== "string") return field;
  const typeInfo = dbToTypes[database] && dbToTypes[database][field.type];
  if (!typeInfo) return field;

  const hasSize = field.size !== undefined && field.size !== null && field.size !== "";
  if (typeInfo.defaultSize !== undefined && !hasSize) {
    return { ...field, size: typeInfo.defaultSize };
  }
  return field;
}

/**
 * Server->client handlers for field commands:
 * addField / updateField / deleteField.
 */
export default function useFieldHandlers() {
  const diagram = useDiagram();

  useServerHandler("addField", (params) => {
    const table = diagram.tables.find((t) => t.id === params.tableId);
    if (!table) throw new Error(`Table ${params.tableId} not found`);
    diagram.updateTable(params.tableId, {
      fields: [...table.fields, withTypeDefaults(params.field, diagram.database)],
    });
  });

  useServerHandler("updateField", (params) => {
    // When a field is retyped, mirror the GUI and backfill the new type's
    // defaultSize unless the same update sets a size explicitly.
    const updates =
      params.updates && typeof params.updates.type === "string"
        ? withTypeDefaults(params.updates, diagram.database)
        : params.updates;
    diagram.updateField(params.tableId, params.fieldId, updates);
  });

  useServerHandler("deleteField", (params) => {
    const table = diagram.tables.find((t) => t.id === params.tableId);
    const field = table?.fields.find((f) => f.id === params.fieldId);
    if (!field) throw new Error("Field not found");
    diagram.deleteField(field, params.tableId, params.addToHistory ?? true);
  });
}
