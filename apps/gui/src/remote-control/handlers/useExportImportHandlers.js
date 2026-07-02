import { useAreas, useDiagram, useEnums, useNotes, useTypes } from "../../hooks";
import { DB } from "../../data/constants";
import { exportSQL } from "../../utils/exportSQL";
import { toDBML } from "../../utils/exportAs/dbml";
import { fromDBML } from "../../utils/importFrom/dbml";
import { ensureEnumIds } from "../../utils/ensureIds";
import { useServerHandler } from "../ws";

/**
 * Server->client handlers for export/import commands:
 * exportSQL / exportDBML / importDBML.
 *
 * exportSQL requires a concrete database type - the `generic` database
 * returns an empty `sql` string (documented tool behavior, not an error).
 */
export default function useExportImportHandlers() {
  const diagram = useDiagram();
  const { setAreas } = useAreas();
  const { setNotes } = useNotes();
  const { enums, setEnums } = useEnums();
  const { types, setTypes } = useTypes();

  useServerHandler("exportSQL", () => {
    const currentDiagram = {
      database: diagram.database,
      tables: diagram.tables,
      relationships: diagram.relationships,
      enums,
      types,
    };
    return {
      sql: exportSQL(currentDiagram),
      database: diagram.database,
    };
  });

  useServerHandler("exportDBML", () => {
    const currentDiagram = {
      database: diagram.database,
      tables: diagram.tables,
      relationships: diagram.relationships,
      enums,
      types,
    };
    return {
      dbml: toDBML(currentDiagram),
    };
  });

  useServerHandler("importDBML", (params) => {
    try {
      const parsed = fromDBML(params.dbml);
      const clear = params.clearCurrent !== false;

      // Mirror importDiagram semantics: when clearing, replace every
      // collection (and database) in a single setter call so previous state
      // cannot leak through.
      if (clear) {
        diagram.setDatabase(parsed.database ?? DB.GENERIC);
        diagram.setTables(parsed.tables ?? []);
        diagram.setRelationships(parsed.relationships ?? []);
        setAreas([]);
        setNotes([]);
        setEnums(ensureEnumIds(parsed.enums));
        setTypes([]);
      } else {
        if (parsed.database !== undefined) {
          diagram.setDatabase(parsed.database);
        }
        if (parsed.tables !== undefined) {
          diagram.setTables(parsed.tables);
        }
        if (parsed.relationships !== undefined) {
          diagram.setRelationships(parsed.relationships);
        }
        if (parsed.enums !== undefined) {
          setEnums(ensureEnumIds(parsed.enums));
        }
      }

      return {
        imported: {
          tableCount: parsed.tables?.length || 0,
          relationshipCount: parsed.relationships?.length || 0,
          enumCount: parsed.enums?.length || 0,
        },
      };
    } catch (error) {
      throw new Error(`DBML import failed: ${error.message}`, {
        cause: error,
      });
    }
  });
}
