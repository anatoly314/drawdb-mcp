// Feature fragment: EXPORT / IMPORT (server -> GUI client).
//
// Wire commands: exportSQL / exportDBML / importDBML.
//
// exportSQL requires a concrete database type — the `generic` database
// returns an empty `sql` string (documented tool behavior, not an error).
// exportDBML / importDBML work with any database type.

import { oc } from "@orpc/contract";
import { z } from "zod";

export const exportImportClientContract = {
  exportSQL: oc.input(z.void()).output(
    z.looseObject({
      sql: z.string(),
      database: z.string(),
    }),
  ),

  exportDBML: oc.input(z.void()).output(
    z.looseObject({
      dbml: z.string(),
    }),
  ),

  importDBML: oc
    .input(
      z.object({
        dbml: z.string(),
        clearCurrent: z.boolean().optional(),
      }),
    )
    .output(
      z.looseObject({
        imported: z.looseObject({
          tableCount: z.number(),
          relationshipCount: z.number(),
          enumCount: z.number(),
        }),
      }),
    ),
};
