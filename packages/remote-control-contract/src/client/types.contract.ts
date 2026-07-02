// Feature fragment: TYPES (custom composite types, server -> GUI client).
// PostgreSQL-only entities.
//
// Wire commands: addType / updateType / deleteType.
//
// Two-phase add (`data: null` first). Types use nanoid STRING ids. Type
// fields are `{ name, type }` objects; the GUI's updateType handler
// back-fills nanoid ids on incoming fields that lack one.

import { oc } from "@orpc/contract";
import { z } from "zod";

import { typeSchema, typeUpdatesSchema } from "../schemas.js";

export const typesClientContract = {
  addType: oc
    .input(
      z.object({
        data: typeSchema.nullable(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(typeSchema),

  updateType: oc
    .input(
      z.object({
        id: z.string(),
        updates: typeUpdatesSchema,
      }),
    )
    .output(z.void()),

  deleteType: oc
    .input(
      z.object({
        id: z.string(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(z.void()),
};
