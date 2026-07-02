import { useAreas } from "../../hooks";
import { useServerHandler } from "../ws";

/**
 * Server->client handlers for area commands: addArea / updateArea / deleteArea.
 *
 * Areas use numeric array-index ids on the GUI side but string ids on the
 * wire, hence the `parseInt(params.id, 10)` lookups.
 */
export default function useAreaHandlers() {
  const { areas, addArea, updateArea, deleteArea } = useAreas();

  useServerHandler("addArea", (params) => {
    // Backend only ever sends `data: null`; non-null data would be misread by
    // the context's add() as an undo/redo `{index, entity}` shape.
    if (params.data != null) {
      throw new Error("addArea with non-null data is not supported");
    }
    return addArea(null, params.addToHistory ?? true);
  });

  useServerHandler("updateArea", (params) => {
    const areaToUpdate = areas.find((a) => a.id === parseInt(params.id, 10));
    if (!areaToUpdate) {
      throw new Error(`Area with id "${params.id}" not found`);
    }
    updateArea(areaToUpdate.id, params.updates);
  });

  useServerHandler("deleteArea", (params) => {
    const areaToDelete = areas.find((a) => a.id === parseInt(params.id, 10));
    if (!areaToDelete) {
      throw new Error(`Area with id "${params.id}" not found`);
    }
    deleteArea(areaToDelete.id, params.addToHistory ?? true);
  });
}
