// Feature fragment: AREAS (server -> GUI client).
//
// Wire commands: addArea / updateArea / deleteArea.
//
// Two-phase add: `addArea` is sent with `data: null`; the GUI creates a
// default area and returns it. Areas use NUMERIC array-index ids on the GUI
// side, but the backend addresses them with STRING ids on the wire
// (`createdArea.id.toString()`), which the GUI `parseInt`s — so `id` inputs
// are strings while the returned entity's `id` is a number.

import { oc } from "@orpc/contract";
import { z } from "zod";

import { areaSchema, areaUpdatesSchema } from "../schemas.js";

export const areasClientContract = {
  addArea: oc
    .input(
      z.object({
        data: areaSchema.nullable(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(areaSchema),

  updateArea: oc
    .input(
      z.object({
        id: z.string(),
        updates: areaUpdatesSchema,
      }),
    )
    .output(z.void()),

  deleteArea: oc
    .input(
      z.object({
        id: z.string(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(z.void()),
};
