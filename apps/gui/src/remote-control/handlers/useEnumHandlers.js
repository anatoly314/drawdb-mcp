import { useEnums } from "../../hooks";
import { useServerHandler } from "../ws";

/**
 * Server->client handlers for enum commands: addEnum / updateEnum / deleteEnum.
 * PostgreSQL-only entities. Enums use nanoid STRING ids - lookups are
 * `e.id === params.id`, never parseInt.
 */
export default function useEnumHandlers() {
  const { enums, addEnum, updateEnum, deleteEnum } = useEnums();

  useServerHandler("addEnum", (params) => {
    // Backend only ever sends `data: null`; non-null data would be misread by
    // the context's add() as an undo/redo `{index, entity}` shape.
    if (params.data != null) {
      throw new Error("addEnum with non-null data is not supported");
    }
    return addEnum(null, params.addToHistory ?? true);
  });

  useServerHandler("updateEnum", (params) => {
    // No need to validate - updateEnum uses functional updates so it works
    // even immediately after creation.
    updateEnum(params.id, params.updates);
  });

  useServerHandler("deleteEnum", (params) => {
    const enumToDelete = enums.find((e) => e.id === params.id);
    if (!enumToDelete) {
      throw new Error(`Enum with id "${params.id}" not found`);
    }
    deleteEnum(enumToDelete.id, params.addToHistory ?? true);
  });
}
