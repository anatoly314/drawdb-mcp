// Feature fragment: FIELDS (server -> GUI client).
//
// Wire commands: addField / updateField / deleteField.
//
// NOTE: unlike addTable/addArea/... there is NO two-phase pattern here — the
// backend generates the field's nanoid itself and sends the complete field
// in one shot. The GUI handler returns NO data for all three commands
// (message-only), including addField.

import { oc } from "@orpc/contract";
import { z } from "zod";

import { fieldSchema, fieldUpdatesSchema } from "../schemas.js";

export const fieldsClientContract = {
  addField: oc
    .input(
      z.object({
        tableId: z.string(),
        field: fieldSchema,
      }),
    )
    .output(z.void()),

  updateField: oc
    .input(
      z.object({
        tableId: z.string(),
        fieldId: z.string(),
        updates: fieldUpdatesSchema,
      }),
    )
    .output(z.void()),

  deleteField: oc
    .input(
      z.object({
        tableId: z.string(),
        fieldId: z.string(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(z.void()),
};
