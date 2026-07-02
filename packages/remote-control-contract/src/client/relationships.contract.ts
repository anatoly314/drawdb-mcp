// Feature fragment: RELATIONSHIPS (server -> GUI client).
//
// Wire commands: addRelationship / updateRelationship / deleteRelationship.
//
// Like fields, relationships are single-shot: the backend generates the
// nanoid and sends the full relationship as `data`. The GUI handler ignores
// the context's return value, so even addRelationship returns NO data.

import { oc } from "@orpc/contract";
import { z } from "zod";

import { relationshipSchema, relationshipUpdatesSchema } from "../schemas.js";

export const relationshipsClientContract = {
  addRelationship: oc
    .input(
      z.object({
        data: relationshipSchema,
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(z.void()),

  updateRelationship: oc
    .input(
      z.object({
        id: z.string(),
        updates: relationshipUpdatesSchema,
      }),
    )
    .output(z.void()),

  deleteRelationship: oc
    .input(
      z.object({
        id: z.string(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(z.void()),
};
