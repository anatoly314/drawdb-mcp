// Entity zod schemas for the DrawDB remote-control wire protocol.
//
// These mirror `apps/backend/src/drawdb/drawdb.types.ts` (the shapes the
// backend sends) while staying LENIENT (`z.looseObject`) because the GUI's
// context objects carry extra fields the backend never sets (`size`,
// `unsigned`, `locked`, note `color`/`width`/`height`, ...). Loose objects
// keep unknown keys on parse, so nothing the GUI returns is stripped.
//
// ID MODEL (see CLAUDE.md "Common Gotchas"):
//   - tables / fields / relationships / enums / types: nanoid STRING ids.
//   - areas / notes: NUMERIC array-index ids on the GUI side. The backend
//     still addresses them with string ids on the wire (`id.toString()`),
//     which the GUI `parseInt`s — so command inputs use `z.string()` while
//     the area/note ENTITY schemas (outputs) use `z.number()`.

import { z } from "zod";

// ----- shared enums ---------------------------------------------------------

export const cardinalitySchema = z.enum(["one_to_one", "one_to_many", "many_to_one"]);

export const referentialConstraintSchema = z.enum([
  "No action",
  "Restrict",
  "Cascade",
  "Set null",
  "Set default",
]);

// ----- entities -------------------------------------------------------------

export const fieldSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  primary: z.boolean(),
  unique: z.boolean(),
  notNull: z.boolean(),
  increment: z.boolean(),
  default: z.string(),
  check: z.string(),
  comment: z.string(),
});

export const tableSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  locked: z.boolean().optional(),
  fields: z.array(fieldSchema),
  comment: z.string(),
  indices: z.array(z.unknown()),
  color: z.string(),
});

export const relationshipSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  startTableId: z.string(),
  startFieldId: z.string(),
  endTableId: z.string(),
  endFieldId: z.string(),
  cardinality: cardinalitySchema,
  updateConstraint: referentialConstraintSchema,
  deleteConstraint: referentialConstraintSchema,
});

export const areaSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string(),
});

export const noteSchema = z.looseObject({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  x: z.number(),
  y: z.number(),
});

export const enumSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  values: z.array(z.string()),
});

// GUI type fields are `{ name, type }` objects (ids are back-filled by the
// GUI's updateType handler), NOT full table fields — keep only name/type
// required and let loose parsing carry everything else.
export const typeFieldSchema = z.looseObject({
  name: z.string(),
  type: z.string(),
});

export const typeSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  fields: z.array(typeFieldSchema),
});

// Full diagram state as returned by `getDiagram`.
export const diagramSchema = z.looseObject({
  database: z.string(),
  tables: z.array(tableSchema),
  relationships: z.array(relationshipSchema),
  areas: z.array(areaSchema),
  notes: z.array(noteSchema),
  enums: z.array(enumSchema),
  types: z.array(typeSchema),
});

// `importDiagram` input: user-supplied JSON. The GUI handler defends against
// every missing key (defaults to empty arrays / preserves state) and even
// BACK-FILLS missing enum/type ids via ensureIds — so requiring the strict
// entity shapes here would reject legacy diagrams the app accepts today.
// Deliberately near-untyped.
export const diagramImportSchema = z.looseObject({
  database: z.string().optional(),
  tables: z.array(z.looseObject({})).optional(),
  relationships: z.array(z.looseObject({})).optional(),
  areas: z.array(z.looseObject({})).optional(),
  notes: z.array(z.looseObject({})).optional(),
  enums: z.array(z.looseObject({})).optional(),
  types: z.array(z.looseObject({})).optional(),
});

// ----- update payloads ------------------------------------------------------
// `update*` commands send a partial entity (never the id inside `updates`).

export const tableUpdatesSchema = tableSchema.omit({ id: true }).partial();
export const fieldUpdatesSchema = fieldSchema.omit({ id: true }).partial();
export const relationshipUpdatesSchema = relationshipSchema.omit({ id: true }).partial();
export const areaUpdatesSchema = areaSchema.omit({ id: true }).partial();
export const noteUpdatesSchema = noteSchema.omit({ id: true }).partial();
export const enumUpdatesSchema = enumSchema.omit({ id: true }).partial();
export const typeUpdatesSchema = typeSchema.omit({ id: true }).partial();

// ----- inferred TS types (replace drawdb.types.ts interfaces in chunk 2) ----

export type DrawDBCardinality = z.infer<typeof cardinalitySchema>;
export type DrawDBReferentialConstraint = z.infer<typeof referentialConstraintSchema>;
export type DrawDBField = z.infer<typeof fieldSchema>;
export type DrawDBTable = z.infer<typeof tableSchema>;
export type DrawDBRelationship = z.infer<typeof relationshipSchema>;
export type DrawDBArea = z.infer<typeof areaSchema>;
export type DrawDBNote = z.infer<typeof noteSchema>;
export type DrawDBEnum = z.infer<typeof enumSchema>;
export type DrawDBTypeField = z.infer<typeof typeFieldSchema>;
export type DrawDBType = z.infer<typeof typeSchema>;
export type DrawDBDiagram = z.infer<typeof diagramSchema>;
export type DrawDBDiagramImport = z.infer<typeof diagramImportSchema>;
