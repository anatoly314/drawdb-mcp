// Feature fragment: ENUMS (server -> GUI client). PostgreSQL-only entities.
//
// Wire commands: addEnum / updateEnum / deleteEnum.
//
// Two-phase add (`data: null` first). Enums use nanoid STRING ids — the GUI
// looks them up with `e.id === params.id` (never parseInt).

import { oc } from "@orpc/contract";
import { z } from "zod";

import { enumSchema, enumUpdatesSchema } from "../schemas.js";

export const enumsClientContract = {
  addEnum: oc
    .input(
      z.object({
        data: enumSchema.nullable(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(enumSchema),

  updateEnum: oc
    .input(
      z.object({
        id: z.string(),
        updates: enumUpdatesSchema,
      }),
    )
    .output(z.void()),

  deleteEnum: oc
    .input(
      z.object({
        id: z.string(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(z.void()),
};
