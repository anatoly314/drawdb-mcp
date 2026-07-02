import useTableHandlers from "./handlers/useTableHandlers";
import useFieldHandlers from "./handlers/useFieldHandlers";
import useRelationshipHandlers from "./handlers/useRelationshipHandlers";
import useAreaHandlers from "./handlers/useAreaHandlers";
import useNoteHandlers from "./handlers/useNoteHandlers";
import useEnumHandlers from "./handlers/useEnumHandlers";
import useTypeHandlers from "./handlers/useTypeHandlers";
import useDiagramHandlers from "./handlers/useDiagramHandlers";
import useExportImportHandlers from "./handlers/useExportImportHandlers";

/**
 * Composes every server->client handler registration for the remote-control
 * connection. Renders nothing - it exists so the handler hooks run below
 * `<OrpcWs>` (where the registration context lives) while still seeing the
 * editor's entity contexts (Diagram/Areas/Notes/Enums/Types), which are
 * provided above the Workspace.
 */
export default function RemoteControlHandlers() {
  useTableHandlers();
  useFieldHandlers();
  useRelationshipHandlers();
  useAreaHandlers();
  useNoteHandlers();
  useEnumHandlers();
  useTypeHandlers();
  useDiagramHandlers();
  useExportImportHandlers();

  return null;
}
