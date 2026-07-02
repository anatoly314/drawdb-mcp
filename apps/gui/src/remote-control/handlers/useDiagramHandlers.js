import { useAreas, useDiagram, useEnums, useNotes, useTypes } from "../../hooks";
import { DB } from "../../data/constants";
import { ensureEnumIds, ensureTypeIds } from "../../utils/ensureIds";
import { useServerHandler } from "../ws";

/**
 * Server->client handlers for diagram-level commands:
 * setDatabase / getDiagram / importDiagram.
 */
export default function useDiagramHandlers() {
  const diagram = useDiagram();
  const { areas, setAreas } = useAreas();
  const { notes, setNotes } = useNotes();
  const { enums, setEnums } = useEnums();
  const { types, setTypes } = useTypes();

  useServerHandler("setDatabase", (params) => {
    diagram.setDatabase(params.database);
  });

  useServerHandler("getDiagram", () => ({
    database: diagram.database,
    tables: diagram.tables,
    relationships: diagram.relationships,
    areas,
    notes,
    enums,
    types,
  }));

  useServerHandler("importDiagram", (params) => {
    const importedDiagram = params.diagram;
    const clear = params.clearCurrent !== false;

    // Replace each entity collection in a single setter call. When clearing,
    // missing fields default to empty arrays so the previous diagram is fully
    // replaced (not merged). When not clearing, missing fields preserve
    // existing state.
    if (clear) {
      diagram.setDatabase(importedDiagram.database ?? DB.GENERIC);
      diagram.setTables(importedDiagram.tables ?? []);
      diagram.setRelationships(importedDiagram.relationships ?? []);
      setAreas(importedDiagram.areas ?? []);
      setNotes(importedDiagram.notes ?? []);
      // Imported enums/types may lack stable ids (legacy exports,
      // hand-written JSON) - back-fill nanoids so id-based lookups work.
      setEnums(ensureEnumIds(importedDiagram.enums));
      setTypes(ensureTypeIds(importedDiagram.types));
    } else {
      if (importedDiagram.database !== undefined) {
        diagram.setDatabase(importedDiagram.database);
      }
      if (importedDiagram.tables !== undefined) {
        diagram.setTables(importedDiagram.tables);
      }
      if (importedDiagram.relationships !== undefined) {
        diagram.setRelationships(importedDiagram.relationships);
      }
      if (importedDiagram.areas !== undefined) {
        setAreas(importedDiagram.areas);
      }
      if (importedDiagram.notes !== undefined) {
        setNotes(importedDiagram.notes);
      }
      if (importedDiagram.enums !== undefined) {
        setEnums(ensureEnumIds(importedDiagram.enums));
      }
      if (importedDiagram.types !== undefined) {
        setTypes(ensureTypeIds(importedDiagram.types));
      }
    }
  });
}
