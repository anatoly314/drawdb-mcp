// Feature fragment: NOTES (server -> GUI client).
//
// Wire commands: addNote / updateNote / deleteNote.
//
// Same model as areas: two-phase add (`data: null` first), numeric
// array-index ids on the GUI side, string ids on the wire.

import { oc } from "@orpc/contract";
import { z } from "zod";

import { noteSchema, noteUpdatesSchema } from "../schemas.js";

export const notesClientContract = {
  addNote: oc
    .input(
      z.object({
        data: noteSchema.nullable(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(noteSchema),

  updateNote: oc
    .input(
      z.object({
        id: z.string(),
        updates: noteUpdatesSchema,
      }),
    )
    .output(z.void()),

  deleteNote: oc
    .input(
      z.object({
        id: z.string(),
        addToHistory: z.boolean().optional(),
      }),
    )
    .output(z.void()),
};
