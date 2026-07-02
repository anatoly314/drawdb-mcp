/**
 * DrawDB entity types — thin re-export shim.
 *
 * The source of truth is `@drawdb-mcp/remote-control-contract` (zod entity
 * schemas shared with the GUI); these aliases keep existing `@/drawdb`
 * type imports compiling. The old wire-protocol types (DrawDBCommand /
 * DrawDBResponse) are gone: framing is owned by the ORPC transport now.
 */

export type {
  DrawDBCardinality,
  DrawDBReferentialConstraint,
  DrawDBField,
  DrawDBTable,
  DrawDBRelationship,
  DrawDBArea,
  DrawDBNote,
  DrawDBEnum,
  DrawDBTypeField,
  DrawDBType,
  DrawDBDiagram,
  DrawDBDiagramImport,
} from "@drawdb-mcp/remote-control-contract";
