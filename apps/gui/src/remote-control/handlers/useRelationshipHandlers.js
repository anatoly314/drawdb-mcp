import { useDiagram } from "../../hooks";
import { useServerHandler } from "../ws";

/**
 * Server->client handlers for relationship commands:
 * addRelationship / updateRelationship / deleteRelationship.
 *
 * Relationships are single-shot: the backend generates the nanoid and sends
 * the full relationship as `data` (no two-phase pattern, no data returned).
 */
export default function useRelationshipHandlers() {
  const diagram = useDiagram();

  useServerHandler("addRelationship", (params) => {
    diagram.addRelationship(params.data, params.addToHistory ?? true);
  });

  useServerHandler("updateRelationship", (params) => {
    diagram.updateRelationship(params.id, params.updates);
  });

  useServerHandler("deleteRelationship", (params) => {
    diagram.deleteRelationship(params.id, params.addToHistory ?? true);
  });
}
