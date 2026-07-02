// Feature fragment: TABLES (server -> GUI client).
//
// Wire commands: addTable / updateTable / deleteTable / getTable.
//
// Two-phase add pattern: the backend's add_table tool first sends
// `addTable` with `data: null` (GUI creates a default table and returns it,
// nanoid id included), then follows up with `updateTable` carrying the real
// name/fields/position — hence `data` is nullable and `updateTable.updates`
// must accept `fields`.

import { oc } from "@orpc/contract";
import { z } from "zod";

import { tableSchema, tableUpdatesSchema } from "../schemas.js";

export const tablesClientContract = {
  addTable: oc
    .input(
      z.object({
        data: tableSchema.nullable(),
        addToHistory: z.boolean().optional(),
      }),
    )
    // GUI returns the created table (full context object, loose).
    .output(tableSchema),

  updateTable: oc
    .input(
      z.object({
        id: z.string(),
        updates: tableUpdatesSchema,
      }),
    )
    // GUI handler returns no data (message-only today).
    .output(z.void()),

  deleteTable: oc
    .input(
      z.object({
        id: z.string(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(z.void()),

  getTable: oc
    .input(
      z.object({
        tableId: z.string().optional(),
        tableName: z.string().optional(),
      }),
    )
    // Untyped for the same reason as getDiagram: read paths can return
    // legacy-shaped tables the entity schema would reject.
    .output(z.any()),
};
