// Feature fragment: DIAGRAM-LEVEL operations (server -> GUI client).
//
// Wire commands: setDatabase / getDiagram / importDiagram.

import { oc } from "@orpc/contract";
import { z } from "zod";

import { diagramImportSchema } from "../schemas.js";

export const diagramClientContract = {
  setDatabase: oc
    .input(
      z.object({
        database: z.string(),
      }),
    )
    .output(z.void()),

  // No input — the backend wrapper sends empty params.
  // Output is deliberately untyped: read paths can carry legacy diagrams
  // (pre-fork enum values, missing keys) that predate the entity schemas,
  // and validation here would reject data the GUI accepts today.
  getDiagram: oc.input(z.void()).output(z.any()),

  // Replaces (clearCurrent, default true) or merges the current diagram.
  // The diagram payload is user-supplied JSON the GUI defends against, so
  // the input schema is deliberately lenient (see diagramImportSchema).
  importDiagram: oc
    .input(
      z.object({
        diagram: diagramImportSchema,
        clearCurrent: z.boolean().optional(),
      }),
    )
    .output(z.void()),
};
