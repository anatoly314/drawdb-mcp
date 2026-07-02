import { nanoid } from "nanoid";
import { useTypes } from "../../hooks";
import { useServerHandler } from "../ws";

/**
 * Server->client handlers for custom-type commands:
 * addType / updateType / deleteType. PostgreSQL-only entities. Types use
 * nanoid STRING ids - lookups are `t.id === params.id`, never parseInt.
 */
export default function useTypeHandlers() {
  const { types, addType, updateType, deleteType } = useTypes();

  useServerHandler("addType", (params) => {
    // Backend only ever sends `data: null`; non-null data would be misread by
    // the context's add() as an undo/redo `{index, entity}` shape.
    if (params.data != null) {
      throw new Error("addType with non-null data is not supported");
    }
    return addType(null, params.addToHistory ?? true);
  });

  useServerHandler("updateType", (params) => {
    // No need to validate - updateType uses functional updates so it works
    // even immediately after creation.
    // Back-fill nanoid ids on incoming type fields so they match the GUI data
    // model.
    const updates = params.updates?.fields
      ? {
          ...params.updates,
          fields: params.updates.fields.map((f) => (f.id ? f : { ...f, id: nanoid() })),
        }
      : params.updates;
    updateType(params.id, updates);
  });

  useServerHandler("deleteType", (params) => {
    const typeToDelete = types.find((t) => t.id === params.id);
    if (!typeToDelete) {
      throw new Error(`Type with id "${params.id}" not found`);
    }
    deleteType(typeToDelete.id, params.addToHistory ?? true);
  });
}
